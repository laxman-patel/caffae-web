// This goes INSIDE the AuthModal component function, before the return statement

import { Button } from "./ui/button";

export const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="20px"
    height="20px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.71,36.336,44,30.606,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

const AuthSeparator = ({ isLoading, isGoogleLoading, handleGoogleSignIn }) => (
  <>
    {" "}
    {/* Use a React Fragment to group elements without adding an extra div */}
    {/* The "Or continue with" divider */}
    <div className="relative my-6">
      {" "}
      {/* Adds vertical margin */}
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        {/* The horizontal line */}
        <div className="w-full border-t border-gray-700/50" />
      </div>
      <div className="relative flex justify-center text-sm">
        {/* The text in the middle */}
        {/* The bg needs to match the DialogContent background to create the "break" */}
        <span className="bg-gray-950/90 px-2 text-gray-500 uppercase">
          Or continue with
        </span>
      </div>
    </div>
    {/* The Google Sign-In Button */}
    <Button
      variant="outline" // White background style
      className="w-full text-base font-medium bg-white text-gray-800 rounded-full h-12 justify-center border-gray-300 hover:bg-gray-100
                   transition-all duration-300 transform hover:scale-[1.03] shadow-sm hover:shadow-md
                   disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
      onClick={handleGoogleSignIn} // Assumes handleGoogleSignIn exists in AuthModal scope
      disabled={isLoading || isGoogleLoading} // Assumes these states exist in AuthModal scope
      type="button" // Prevent form submission
    >
      {isGoogleLoading ? (
        "Redirecting..." // Loading text
      ) : (
        <>
          <GoogleIcon className="mr-2" />
          <p className="mr-2"> Sign in with Google </p>
        </>
      )}
    </Button>
  </>
);

export default AuthSeparator;

// Then, you use it like this inside the <TabsContent> for both Sign In and Sign Up:
// <TabsContent value="signin" ...>
//   ... (email/password form) ...
//   <AuthSeparator />
// </TabsContent>
//
// <TabsContent value="signup" ...>
//   ... (email/password form) ...
//   <AuthSeparator />
// </TabsContent>
