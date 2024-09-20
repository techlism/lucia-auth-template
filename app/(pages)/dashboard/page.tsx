import { validateRequest } from "@/lib/lucia";
import { permanentRedirect } from "next/navigation";

export default async function Dashboard(){
    const { user } = await validateRequest();
    if(!user){
        return permanentRedirect('/sign-in');
    }
    return(
        <div>
            <h1>Dashboard</h1>
            <p>
                {`Welcome to the dashboard, ${user.id}`}
            </p>
        </div>
    )
}