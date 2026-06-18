// This file handles the entire Google Sign-In and API client flow.
// It uses Google Identity Services (GIS) for Web and Capacitor Firebase Auth for native mobile.
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../src/services/firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// --- TypeScript Declarations for Google APIs ---
declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

// --- Configuration ---
const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// --- Module State ---
let onLoginSuccessCallback: ((profile: UserProfile, apiAuthorized: boolean) => void) | null = null;
let onLogoutCallback: (() => void) | null = null;
let accessToken: string | null = null;
let gapiInited = false;
let gapiScriptLoaded = false;

// --- Helper Functions ---

/**
 * Decodes the JWT credential returned by Google Sign-In to extract user profile information.
 */
const decodeJwtResponse = (token: string): UserProfile => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        return {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
        };
    } catch (e) {
        console.error("Error decoding JWT", e);
        throw new Error("Invalid JWT token received.");
    }
};


// --- Core Authentication Flow ---

/**
 * This callback is triggered by Google after a user successfully signs in
 * via One Tap or the Sign-In button.
 */
const handleCredentialResponse = (response: any) => {
    if (!response.credential) {
        console.error("Credential response is missing credential.", response);
        if (onLoginSuccessCallback) {
            // Can't proceed without a credential, treat as a failed login attempt.
            // In a real app, you might want more specific error handling.
        }
        return;
    }

    const profile = decodeJwtResponse(response.credential);

    // FIX: The user is now considered authenticated.
    // The `onLoginSuccessCallback` is called immediately to log the user into the app.
    // We initially assume API authorization is not granted.
    // This prevents the login loop if the subsequent API token request fails.
    if (onLoginSuccessCallback) {
        onLoginSuccessCallback(profile, false);
    }
    
    // Now, separately attempt to get an API access token for Google Calendar.
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
                console.error('Token Error:', tokenResponse.error, tokenResponse.error_description);
                // The user is already logged in, so we just log the API error.
                // The app will show integrations as disconnected.
                return;
            }
            accessToken = tokenResponse.access_token;
            
            const checkGapi = () => {
                if (gapiInited) {
                    window.gapi.client.setToken({ access_token: accessToken });
                    // API authorization was successful.
                    // We call the login callback AGAIN, this time with apiAuthorized = true.
                    // The app's `handleLoginSuccess` function is idempotent and will simply
                    // update the integration status without re-loading all user data.
                    if (onLoginSuccessCallback) {
                        onLoginSuccessCallback(profile, true);
                    }
                } else {
                    setTimeout(checkGapi, 100);
                }
            };
            checkGapi();
        },
    });
    
    // Request an access token silently. If consent is required, a popup may appear.
    tokenClient.requestAccessToken({ prompt: '' });
};

let gisInitialized = false;

/**
 * Polls until the Google Identity Services (GIS) script is loaded and ready.
 */
const initializeGis = () => {
    if (Capacitor.isNativePlatform()) {
        // Native mobile doesn't use GIS script. It will use FirebaseAuthentication plugin on button click.
        return;
    }

    if (window.google?.accounts?.id && !gisInitialized) {
        window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: true, // Enables automatic sign-in for returning users
        });
        
        gisInitialized = true;

        // Display the One Tap prompt for returning users.
        window.google.accounts.id.prompt();
    } else if (!window.google?.accounts?.id) {
        setTimeout(initializeGis, 100);
    }
};

/**
 * Renders the Google Sign-In button in the specified container.
 */
export const renderSignInButton = (containerId: string) => {
    const signInButtonElement = document.getElementById(containerId);
    
    if (Capacitor.isNativePlatform()) {
        if (signInButtonElement) {
             // Create a custom button for native
             const btn = document.createElement('button');
             btn.innerText = 'Sign in with Google';
             btn.className = 'w-full py-2 bg-white text-black font-semibold rounded-lg shadow-md';
             btn.onclick = async () => {
                 try {
                     const result = await FirebaseAuthentication.signInWithGoogle();
                     if (result.credential?.idToken) {
                         const credential = GoogleAuthProvider.credential(result.credential.idToken);
                         await signInWithCredential(auth, credential);
                         if (onLoginSuccessCallback && result.user) {
                             onLoginSuccessCallback({
                                 id: result.user.uid,
                                 name: result.user.displayName || 'Awakened',
                                 email: result.user.email || '',
                                 picture: result.user.photoUrl || ''
                             }, false); // Assume false for Calendar API natively initially
                         }
                     }
                 } catch (e) {
                     console.error("Native Google Sign In Failed", e);
                 }
             };
             signInButtonElement.appendChild(btn);
        }
        return;
    }

    const tryRender = () => {
        if (window.google?.accounts?.id && gisInitialized) {
            if (signInButtonElement) {
                window.google.accounts.id.renderButton(
                    signInButtonElement,
                    { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', width: '280' }
                );
            }
        } else {
            setTimeout(tryRender, 100);
        }
    };
    tryRender();
};

/**
 * Initializes the entire Google authentication service.
 * Sets up GIS for sign-in and loads GAPI for Calendar API access.
 */
export const init = (
    onLogin: (profile: UserProfile, apiAuthorized: boolean) => void,
    onLogout: () => void
) => {
    onLoginSuccessCallback = onLogin;
    onLogoutCallback = onLogout;

    // Start polling for the GIS script (loaded from index.html)
    initializeGis();

    // Dynamically load the GAPI script for Calendar API access.
    if (!gapiScriptLoaded) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.id = 'gapi-script';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({
                    discoveryDocs: [
                        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
                    ],
                });
                gapiInited = true;
            });
        };
        document.body.appendChild(script);
        gapiScriptLoaded = true;
    }
};

/**
 * Signs the user out by disabling One Tap for the session and revoking the access token.
 */
export const signOut = async () => {
    if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
        await auth.signOut();
        if (onLogoutCallback) {
            onLogoutCallback();
        }
        return;
    }

    if (window.google?.accounts?.id) {
        // Prevents the One Tap prompt from appearing immediately after manual sign-out.
        window.google.accounts.id.disableAutoSelect();
    }

    if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
            if (onLogoutCallback) {
                onLogoutCallback();
            }
        });
    } else if (onLogoutCallback) {
        // If there was no token, still ensure the app's state is logged out.
        onLogoutCallback();
    }
};

/**
 * Returns the initialized GAPI client, ready for API calls.
 * Waits for initialization if it's not ready yet.
 */
export const getGapiClient = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const checkGapi = () => {
            if (gapiInited) {
                resolve(window.gapi);
            } else {
                setTimeout(checkGapi, 100);
            }
        };
        checkGapi();
    });
};