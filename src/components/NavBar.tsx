import React from 'react';
import {NavLink} from "react-router-dom";

const NavBar = () => {
    return (
        <nav className="bg-gray-900 text-white px-6 py-3 flex justify-start items-center gap-2">
            <h1 className="text-lg font-semibold">Algo Website</h1>
            <div className="flex space-x-6">
                <NavLink
                    to="/"
                    end
                    className={({isActive})=> (
                        isActive ? "text-blue-400 font-semibold" : "hover:text-blue-300"
                    )}
                >
                    Home
                </NavLink>
            </div>
        </nav>

    );
};

export default NavBar;
