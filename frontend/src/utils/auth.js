// Token + user storage.
// "Remember me" -> localStorage (stays after closing the browser)
// otherwise      -> sessionStorage (cleared when the tab/browser closes)

const TOKEN_KEY = "token";
const USER_KEY = "user";
export const USER_UPDATED_EVENT = "foodnest-user-updated";

const read = (key) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key);

export const getToken = () => read(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(read(USER_KEY));
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  [localStorage, sessionStorage].forEach((store) => {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  });
};

export const setAuth = (token, user, remember = false) => {
  clearAuth();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
};

// keep the user in whichever storage already holds the token
export const updateStoredUser = (user) => {
  const store = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  store.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
};

// true only when a token exists AND has not expired
export const isAuthenticated = () => {
  const token = getToken();
  if (!token || token === "undefined" || token === "null") return false;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearAuth();
      return false;
    }
    return true;
  } catch {
    clearAuth();
    return false;
  }
};
