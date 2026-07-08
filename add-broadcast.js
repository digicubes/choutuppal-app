const fs = require('fs');
let code = fs.readFileSync('src/components/admin-view.tsx', 'utf8');

const broadcastCode = `
      {/* Broadcast Notifications UI */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6 text-indigo-500" /> Broadcast Push Notification</h3>
        <p className="text-sm text-gray-500">Send a live push notification to all subscribed users.</p>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const title = formData.get('title')
          const body = formData.get('body')
          const url = formData.get('url')
          
          try {
            const res = await fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, body, url })
            })
            if (res.ok) {
              toast.success('Broadcast sent successfully!')
              e.currentTarget.reset()
            } else {
              toast.error('Failed to send broadcast')
            }
          } catch(err) {
            toast.error('Failed to send broadcast')
          }
        }} className="space-y-4">
          <div>
            <Label>Notification Title</Label>
            <Input name="title" required placeholder="Mega Sale Starts Today!" />
          </div>
          <div>
            <Label>Message Body</Label>
            <Input name="body" required placeholder="Get 50% off on all items..." />
          </div>
          <div>
            <Label>Target URL (Optional)</Label>
            <Input name="url" placeholder="https://..." />
          </div>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Send Broadcast</Button>
        </form>
      </div>
`;

code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">/, broadcastCode + "\n\n          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">");

fs.writeFileSync('src/components/admin-view.tsx', code);
console.log('Broadcast UI Added successfully!');
