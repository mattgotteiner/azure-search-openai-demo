import { Outlet, NavLink, Link } from "react-router-dom";

import { PublicClientApplication } from '@azure/msal-browser';


import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { Container } from 'react-bootstrap';
import { IdTokenData } from '../../components/IdTokenData';
import { Button } from 'react-bootstrap';
import { loginRequest } from '../../authconfig';
import { useState } from 'react';

import github from "../../assets/github.svg";

import styles from "./Layout.module.css";

interface LayoutProps {
    instance: PublicClientApplication;
}

const Layout: React.FC<LayoutProps> = (props) => {
    const [account, setAccount] = useState(props.instance.getActiveAccount())

    const handleLoginPopup = () => {
        /**
         * When using popup and silent APIs, we recommend setting the redirectUri to a blank page or a page
         * that does not implement MSAL. Keep in mind that all redirect routes must be registered with the application
         * For more information, please follow this link: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#redirecturi-considerations
         */
        props.instance
            .loginPopup({
                ...loginRequest,
                redirectUri: '/redirect',
            })
            .catch((error) => console.log(error))
            .then(r => {
                if (r?.account) {
                    props.instance.setActiveAccount(r.account)
                    console.log('claims', r.idTokenClaims)
                    setAccount(r.account)
                }
            })

    };

    const handleLoginRedirect = () => {
        props.instance.loginRedirect(loginRequest).catch((error) => console.log(error))
    }

    const handleLogoutPopup = () => {
        props.instance
            .logoutPopup({
                mainWindowRedirectUri: '/', // redirects the top level app after logout
                account: props.instance.getActiveAccount(),
            })
            .catch((error) => { console.log(error); })
    };

    const handleLogoutRedirect = () => {
        props.instance.logoutRedirect().catch((error) => console.log(error)).then(r => {
            setAccount(null);
        })
    };

    return (
        <MsalProvider instance={props.instance}>
            <div className={styles.layout}>
                <header className={styles.header} role={"banner"}>
                    <div className={styles.headerContainer}>
                        <Link to="/" className={styles.headerTitleContainer}>
                            <h3 className={styles.headerTitle}>GPT + Enterprise data | Sample</h3>
                        </Link>
                        <nav>
                            <ul className={styles.headerNavList}>
                                <li>
                                    <NavLink to="/" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Chat
                                    </NavLink>
                                </li>
                                <li className={styles.headerNavLeftMargin}>
                                    <NavLink to="/qa" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Ask a question
                                    </NavLink>
                                </li>
                                <li className={styles.headerNavLeftMargin}>
                                    <a href="https://aka.ms/entgptsearch" target={"_blank"} title="Github repository link">
                                        <img
                                            src={github}
                                            alt="Github logo"
                                            aria-label="Link to github repository"
                                            width="20px"
                                            height="20px"
                                            className={styles.githubLogo}
                                        />
                                    </a>
                                </li>
                                <AuthenticatedTemplate>
                                    <li className={styles.headerNavLeftMargin}>
                                        <button className={styles.commandButton}
                                                onClick={handleLogoutPopup}
                                        >
                                                Sign out of {account?.name ?? 'Unknown'}
                                        </button>
                                    </li>
                                </AuthenticatedTemplate>
                                <UnauthenticatedTemplate>
                                    <li className={styles.headerNavLeftMargin}>
                                        <button className={styles.commandButton}
                                                onClick={handleLoginPopup}
                                        >
                                                Sign in
                                        </button>
                                    </li>
                                </UnauthenticatedTemplate>
                            </ul>
                        </nav>
                        <h4 className={styles.headerRightText}>Azure OpenAI + Cognitive Search</h4>
                    </div>
                </header>

                <AuthenticatedTemplate>
                    <Outlet />
                </AuthenticatedTemplate>

                <UnauthenticatedTemplate>
                    <h5 className="card-title">Please sign-in.</h5>
                </UnauthenticatedTemplate>
            </div>
        </MsalProvider>
    );
};

export default Layout;
