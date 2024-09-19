import { validateRequest } from "@/lib/lucia";

export default async function Home() {
  const { user } = await validateRequest();
  if (user) {
    return (
      <div className="grid grid-cols-1 items-center p-4 border rounded-md gap-4 mx-auto max-w-96 min-h-screen">
        <h1>Home</h1>
        <p>
          {user.id}        
        </p>
        <a href="/sign-out" className="p-4 border rounded-lg">
          Sign-out
        </a>
      </div>
    )
  }
  return(
    <div className="grid grid-cols-1 items-center p-4 border rounded-md gap-4 mx-auto max-w-96 min-h-screen">
      <h1>Home</h1> 
      <a href="/sign-up" className="p-4 border rounded-lg">
        Sign-up
      </a>
      <a href="/sign-in" className="p-4 border rounded-lg">
        Sign-in
      </a>
    </div>
  )
}