const authConfig = {
  providers: [
    {
      // Clerk JWT issuer domain configured in Convex Dashboard environment variables
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
