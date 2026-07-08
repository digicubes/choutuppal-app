import re

with open('src/components/dashboard-view.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r"const \{ data: listingsData(.*?) = useSWR\(\s*(.*?),\s*fetcher\s*\)",
    r"const { data: listingsData\1 = useSWR(\n      \2,\n      fetcher,\n      { revalidateOnMount: true, revalidateIfStale: true }\n    )",
    content,
    flags=re.DOTALL
)

with open('src/components/dashboard-view.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Dashboard patched')
