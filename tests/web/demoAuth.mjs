export const DEMO_USER = "demo";
export const DEMO_PASSWORD = "demo";

export function isDemoLogin(user, password) {
  return user === DEMO_USER && password === DEMO_PASSWORD;
}
