import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';

export const PrivateRoute = () => {
    const user = useAuth();
    // console.log(user.user)

    // If authorized, return an outlet that will render child elements
    // If not, return element that will navigate to login page
    return user.user ? <Outlet /> : <Navigate to="/devlogin" />;
}