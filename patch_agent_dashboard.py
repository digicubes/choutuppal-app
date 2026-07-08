import os
import re

file_path = 'src/components/agent-dashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Star to lucide imports
if 'Star' not in content:
    content = content.replace("import { Plus, UploadCloud, Trash2 }", "import { Plus, UploadCloud, Trash2, Star }")
    if 'import { Plus, UploadCloud, Trash2 }' not in content:
        # Fallback if the above fails
        content = content.replace("import {", "import { Star,", 1)

# Modify the initial form state to include rating
content = content.replace(
    "address: '', coverImage: '', logoUrl: '', galleryUrls: [] as string[], youtubeUrl: ''",
    "address: '', coverImage: '', logoUrl: '', galleryUrls: [] as string[], youtubeUrl: '', rating: 5"
)
content = content.replace(
    "address: l.address || '', coverImage: l.coverImage || '', logoUrl: l.logoUrl || '', galleryUrls: l.gallery ? JSON.parse(l.gallery) as string[] : [] as string[], youtubeUrl: l.youtubeUrl || ''",
    "address: l.address || '', coverImage: l.coverImage || '', logoUrl: l.logoUrl || '', galleryUrls: l.gallery ? JSON.parse(l.gallery) as string[] : [] as string[], youtubeUrl: l.youtubeUrl || '', rating: l.rating || 5"
)

# Insert the Rating Input after Description or near the end.
# We'll put it right before the Submit button
submit_button_match = """                    <Button onClick={submitListing} className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#4169E1] text-white font-bold rounded-xl text-lg hover:opacity-90">"""

rating_ui = """                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Rating (1 to 5 Stars)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-8 h-8 cursor-pointer transition-colors ${star <= formData.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            onClick={() => setFormData({...formData, rating: star})}
                          />
                        ))}
                      </div>
                    </div>

"""

content = content.replace(submit_button_match, rating_ui + submit_button_match)

# To ensure typescript doesn't complain, we must make sure `rating: number` is in formData if we add it, but it infers from initial state. We might need to check if there is an explicit interface.
# formData doesn't have an explicit interface, it infers from useState.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched agent-dashboard.tsx")
