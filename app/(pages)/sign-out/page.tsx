import { validateRequest } from "@/lib/lucia";
import { permanentRedirect} from "next/navigation";
import { signOut } from "./action";
export default async function SignOutPage(){
    const { user } = await validateRequest();
    
    if(!user){
        return permanentRedirect('/sign-in');
    }

    await signOut();
    return permanentRedirect('/');
    
}