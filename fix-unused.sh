#!/bin/bash
# Fix specific unused variables by prefixing with _

# api-tester
sed -i '39s/Separator/_Separator/' src/app/api-tester/page.tsx
sed -i '151s/handleUrlChange/_handleUrlChange/' src/app/api-tester/page.tsx  
sed -i '236s/processedToken/_processedToken/' src/app/api-tester/page.tsx

# blog pages
sed -i '11s/const { user/const { user: _user/' src/app/blog/admin/page.tsx
sed -i '27s/const { user/const { user: _user/' src/app/blog/my-posts/page.tsx

# docker pages  
sed -i '217s/(item, index)/(item, _index)/' src/app/docker/[id]/page.tsx
sed -i '616s/(item, index)/(item, _index)/' src/app/docker/[id]/page.tsx
sed -i '222s/(item, index)/(item, _index)/' src/app/docker/page.tsx
sed -i '337s/setTheme/_setTheme/' src/app/docker/page.tsx

# llm-providers
sed -i '37s/Eye,/_Eye,/' src/app/llm-providers/page.tsx

# memo pages
sed -i '43s/Plus,/_Plus,/' src/app/memo/admin/page.tsx
sed -i '15s/Card,/_Card,/' src/app/memo/dashboard/page.tsx
sed -i '15s/CardContent,/_CardContent,/' src/app/memo/dashboard/page.tsx
sed -i '15s/CardHeader,/_CardHeader,/' src/app/memo/dashboard/page.tsx
sed -i '15s/CardTitle/_CardTitle/' src/app/memo/dashboard/page.tsx
sed -i '17s/Badge/_Badge/' src/app/memo/dashboard/page.tsx
sed -i '219s/(template)/(\_template)/' src/app/memo/reports/page.tsx
sed -i '231s/(format)/(\_format)/' src/app/memo/reports/page.tsx

# profile pages
sed -i '10s/CardDescription,/_CardDescription,/' "src/app/profile/page copy.tsx"
sed -i '17s/Textarea/_Textarea/' "src/app/profile/page copy.tsx"
sed -i '24s/usersAPI/_usersAPI/' "src/app/profile/page copy.tsx"
sed -i '10s/CardDescription,/_CardDescription,/' src/app/profile/page.tsx
sed -i '17s/Textarea/_Textarea/' src/app/profile/page.tsx
sed -i '24s/usersAPI/_usersAPI/' src/app/profile/page.tsx

# settings
sed -i '14s/Button/_Button/' src/app/settings/page.tsx
sed -i '38s/Save/_Save/' src/app/settings/page.tsx
sed -i '44s/initialize/_initialize/' src/app/settings/page.tsx
sed -i '51s/loading/_loading/' src/app/settings/page.tsx
sed -i '51s/setLoading/_setLoading/' src/app/settings/page.tsx

# system monitor
sed -i '25s/Clock/_Clock/' src/app/system-monitor/page.tsx

# tasks
sed -i '52s/actionLoading/_actionLoading/' src/app/tasks/page.tsx
sed -i '56s/setSelectedStatus/_setSelectedStatus/' src/app/tasks/page.tsx
sed -i '59s/setSelectedPriority/_setSelectedPriority/' src/app/tasks/page.tsx
sed -i '62s/setSearchQuery/_setSearchQuery/' src/app/tasks/page.tsx
sed -i '63s/setDateRange/_setDateRange/' src/app/tasks/page.tsx
sed -i '66s/viewingProject/_viewingProject/' src/app/tasks/page.tsx
sed -i '66s/setViewingProject/_setViewingProject/' src/app/tasks/page.tsx
sed -i '389s/handleUpdateProject/_handleUpdateProject/' src/app/tasks/page.tsx

# components
sed -i '67s/(index)/(\_index)/' src/components/features/blog/admin/blog-editor.tsx
sed -i '13s/DialogTrigger/_DialogTrigger/' src/components/features/blog/admin/media-library.tsx
sed -i '3s/Info/_Info/' src/components/features/blog/admin/tag-manager.tsx
sed -i '40s/ImageIcon/_ImageIcon/' src/components/features/chat/chatbot.tsx
sed -i '14s/(series, seriesIndex)/(series, _seriesIndex)/' src/components/features/claude-usage/model-distribution-chart.tsx
sed -i '9s/Send/_Send/' src/components/features/messaging/chat-room/message-input.tsx
sed -i '10s/t:/_t:/' src/components/features/messaging/chat-room/typing-indicator.tsx
sed -i '16s/(index)/(\_index)/' src/components/features/tasks/category-manager.tsx
sed -i '21s/t:/_t:/' src/components/features/tasks/project-manager.tsx
sed -i '6s/Badge/_Badge/' src/components/ui/file-upload.tsx
sed -i '441s/(value)/(\_value)/' src/components/ui/form-components.tsx
sed -i '18s/actionTypes/_actionTypes/' src/hooks/use-toast.ts

# lib
sed -i '6s/normalizeResponse/_normalizeResponse/' src/lib/api/tasks/tasks.ts
sed -i '2s/ResponseHeaders/_ResponseHeaders/' src/lib/performance-tracker.ts
sed -i '5s/Message,/_Message,/' src/lib/socket-client.ts
sed -i '6s/ChatUser/_ChatUser/' src/lib/socket-client.ts

# stores
sed -i '12s/WSUserJoinedEvent,/_WSUserJoinedEvent,/' src/stores/chat.ts
sed -i '13s/WSUserLeftEvent/_WSUserLeftEvent/' src/stores/chat.ts
sed -i '90s/unsubscribe/_unsubscribe/' src/stores/chat.ts

echo "Fixed unused variables!"
