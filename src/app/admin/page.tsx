import { Metadata } from 'next'
import AdminContainer from '@/components/admin-container'

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Panel | Choutuppal',
  description: 'Manage the application',
}

export default function AdminPage() {
  return <AdminContainer />
}
