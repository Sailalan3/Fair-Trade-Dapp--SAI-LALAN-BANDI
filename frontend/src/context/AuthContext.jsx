import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { addLoginRecord, addActivityLog, ACTIVITY_TYPES } from "../utils/activityLog";
import { syncUserLogin } from "../utils/backendSync";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fairtrace_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.preferredRole && parsed.role) parsed.preferredRole = parsed.role;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem("fairtrace_user");
    } finally {
      setLoading(false);
    }
  }, []);

  // Register a new user
  const register = useCallback(({ fullName, firstName, middleName, lastName, email, password, role, preferredRole, walletAddress, phone, organization, country, securityQuestions }) => {
    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");

    if (users.find((u) => u.email === email)) {
      throw new Error("An account with this email already exists");
    }

    const newUser = {
      id: Date.now().toString(),
      fullName: fullName || [firstName, middleName, lastName].filter(Boolean).join(" "),
      firstName: firstName || "",
      middleName: middleName || "",
      lastName: lastName || "",
      email,
      password, // In production, this would be hashed
      role: preferredRole || role || "farmer",
      preferredRole: preferredRole || role || "farmer",
      walletAddress: walletAddress || "",
      phone: phone || { countryCode: "+1", number: "" },
      organization: organization || "",
      country: country || "",
      securityQuestions: securityQuestions || [],
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem("fairtrace_users", JSON.stringify(users));

    // Mirror to backend (creates User doc + returns JWT). Fire-and-forget.
    if (newUser.walletAddress) {
      syncUserLogin(newUser.walletAddress.toLowerCase(), newUser.fullName, newUser.role)
        .then((data) => {
          if (data?.token) localStorage.setItem("token", data.token);
        })
        .catch(() => {});
    }

    return newUser;
  }, []);

  // Login with email and password
  const login = useCallback((email, password) => {
    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
    const found = users.find((u) => u.email === email && u.password === password);

    if (!found) {
      throw new Error("Invalid email or password");
    }

    const sessionUser = {
      id: found.id,
      fullName: found.fullName,
      firstName: found.firstName || "",
      middleName: found.middleName || "",
      lastName: found.lastName || "",
      email: found.email,
      role: found.preferredRole || found.role,
      preferredRole: found.preferredRole || found.role,
      walletAddress: found.walletAddress || "",
      phone: found.phone || { countryCode: "+1", number: "" },
      organization: found.organization || "",
      country: found.country || "",
    };

    localStorage.setItem("fairtrace_user", JSON.stringify(sessionUser));
    setUser(sessionUser);

    // Mirror to backend
    if (sessionUser.walletAddress) {
      syncUserLogin(sessionUser.walletAddress.toLowerCase(), sessionUser.fullName, sessionUser.role)
        .then((data) => {
          if (data?.token) localStorage.setItem("token", data.token);
        })
        .catch(() => {});
    }

    // Log login activity
    addLoginRecord(email, true, "email");
    addActivityLog({ userEmail: email, type: ACTIVITY_TYPES.LOGIN, description: "Logged in via email", details: { method: "email" } });

    return sessionUser;
  }, []);

  // Login with MetaMask wallet
  const loginWithWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to use wallet login.");
    }

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const address = accounts[0].toLowerCase();

    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
    let found = users.find((u) => u.walletAddress?.toLowerCase() === address);

    if (!found) {
      found = {
        id: Date.now().toString(),
        fullName: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        walletAddress: address,
        role: "farmer",
        preferredRole: "farmer",
        phone: { countryCode: "+1", number: "" },
        organization: "",
        country: "",
        securityQuestions: [],
        createdAt: new Date().toISOString(),
      };
      users.push(found);
      localStorage.setItem("fairtrace_users", JSON.stringify(users));
    }

    const sessionUser = {
      id: found.id,
      fullName: found.fullName,
      firstName: found.firstName || "",
      middleName: found.middleName || "",
      lastName: found.lastName || "",
      email: found.email || "",
      role: found.preferredRole || found.role,
      preferredRole: found.preferredRole || found.role,
      walletAddress: found.walletAddress,
      phone: found.phone || { countryCode: "+1", number: "" },
      organization: found.organization || "",
      country: found.country || "",
    };

    localStorage.setItem("fairtrace_user", JSON.stringify(sessionUser));
    setUser(sessionUser);

    // Mirror to backend (creates User doc keyed by walletAddress + returns JWT)
    syncUserLogin(sessionUser.walletAddress.toLowerCase(), sessionUser.fullName, sessionUser.role)
      .then((data) => {
        if (data?.token) localStorage.setItem("token", data.token);
      })
      .catch(() => {});

    return sessionUser;
  }, []);

  // Update user profile
  const updateProfile = useCallback((updates) => {
    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) throw new Error("User not found");

    // Update stored user
    Object.assign(users[idx], updates);
    if (updates.firstName !== undefined || updates.middleName !== undefined || updates.lastName !== undefined) {
      users[idx].fullName = [updates.firstName ?? users[idx].firstName, updates.middleName ?? users[idx].middleName, updates.lastName ?? users[idx].lastName].filter(Boolean).join(" ");
    }
    localStorage.setItem("fairtrace_users", JSON.stringify(users));

    // Update session
    const sessionUser = {
      id: users[idx].id,
      fullName: users[idx].fullName,
      firstName: users[idx].firstName || "",
      middleName: users[idx].middleName || "",
      lastName: users[idx].lastName || "",
      email: users[idx].email,
      role: users[idx].preferredRole || users[idx].role,
      preferredRole: users[idx].preferredRole || users[idx].role,
      walletAddress: users[idx].walletAddress || "",
      phone: users[idx].phone || { countryCode: "+1", number: "" },
      organization: users[idx].organization || "",
      country: users[idx].country || "",
    };

    localStorage.setItem("fairtrace_user", JSON.stringify(sessionUser));
    setUser(sessionUser);
  }, [user]);

  // Change password
  const changePassword = useCallback((currentPassword, newPassword) => {
    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) throw new Error("User not found");
    if (users[idx].password !== currentPassword) throw new Error("Current password is incorrect");
    users[idx].password = newPassword;
    localStorage.setItem("fairtrace_users", JSON.stringify(users));
  }, [user]);

  // Reset password via security questions
  const resetPasswordWithQuestions = useCallback((email, answers, newPassword) => {
    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) throw new Error("No account found with this email");

    const stored = users[idx].securityQuestions || [];
    if (stored.length < 2) throw new Error("This account has no security questions set up");

    // Verify answers
    for (let i = 0; i < stored.length; i++) {
      if (stored[i].answer !== answers[i]?.toLowerCase().trim()) {
        throw new Error("Security question answers are incorrect");
      }
    }

    users[idx].password = newPassword;
    localStorage.setItem("fairtrace_users", JSON.stringify(users));
    return true;
  }, []);

  // Get security questions for an email (for forgot password flow)
  const getSecurityQuestions = useCallback((email) => {
    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
    const found = users.find((u) => u.email === email);
    if (!found) throw new Error("No account found with this email");
    if (!found.securityQuestions || found.securityQuestions.length < 2) {
      throw new Error("This account has no security questions set up");
    }
    return found.securityQuestions.map((sq) => sq.question);
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("fairtrace_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithWallet,
        register,
        logout,
        updateProfile,
        changePassword,
        resetPasswordWithQuestions,
        getSecurityQuestions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
