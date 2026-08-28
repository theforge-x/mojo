import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const role = (await cookies()).get('mojo_role')?.value;
  redirect(role === 'tutor' ? '/tutor/home' : '/student/home');
}