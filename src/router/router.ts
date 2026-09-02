import { Router } from "express";
import { authRoute } from "../modules/auth/auth.controller";
import { userRoute } from "../modules/user/user.controller";

const router = Router();

const moduleRoutes = [
  {
    path: "/api/v1/auth",
    route: authRoute,
  },
  {
    path: "/api/v1/user",
    route: userRoute,
  },

  // Add new Diganta Rx modules here as you build them, e.g.:
  // { path: "/api/v1/doctor", route: doctorRoute },
  // { path: "/api/v1/territory", route: territoryRoute },
  // { path: "/api/v1/sample", route: sampleRoute },
  // { path: "/api/v1/visit", route: visitRoute },
  // { path: "/api/v1/target", route: targetRoute },
  // { path: "/api/v1/claim", route: claimRoute },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
