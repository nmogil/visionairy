import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Join Visionairy</h1>
        <p className="text-muted-foreground">Create your account to start playing</p>
      </div>
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border-0"
          }
        }}
      />
    </div>
  );
}