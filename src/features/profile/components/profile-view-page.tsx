'use client';
import { useSession } from 'next-auth/react';

export default function ProfileViewPage() {
  const { data: session } = useSession();

  return (
    <div className='flex w-full flex-col p-4'>
      {session ? (
        <div>
          <h1>{session.user.name}</h1>
          <p>{session.user.email}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
