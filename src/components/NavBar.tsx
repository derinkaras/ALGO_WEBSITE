import {NavLink} from "react-router-dom";
import icons from "../constants/icons.ts";
import {useEffect, useState} from "react";
import Modal from "./Modal.tsx";
import SignUp from "./SignUp.tsx";
import {useAuth} from "../contexts/AuthContext.tsx";

const NavBar = () => {

    const [showModal, setShowModal] = useState(false)
    useEffect(() => {
        console.log("Show modal clicked and value changed")
    }, [showModal])
    const {session, signOutUser}  = useAuth()
    const user = session?.user;

    return (
        <div className="flex bg-brand-green items-center">

            <nav className="text-white px-6 py-3 flex flex-col justify-center items-center flex-1">
                <div className="flex justify-between items-center gap-2">
                    <img
                        src={icons.robot}
                        alt="Robot"
                        className="size-8 object-contain flex justify-center items-center"
                    />
                    <h1 className="text-3xl font-bold text-brand-yellow"><span className="text-white">AL</span>GO</h1>
                </div>

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
                    <NavLink
                        to="/nba"
                        className={({isActive})=> (
                            isActive ? "text-blue-400 font-semibold" : "hover:text-blue-300"
                        )}
                    >
                        NBA
                    </NavLink>
                    <NavLink
                        to="/mlb"
                        className={({isActive})=> (
                            isActive ? "text-blue-400 font-semibold" : "hover:text-blue-300"
                        )}
                    >
                        MLB
                    </NavLink>
                </div>


            </nav>

            {showModal && (
                <Modal handleCloseModal={() => setShowModal(false)}>
                    <SignUp
                        handleCloseModal={() => setShowModal(false)}
                    />
                </Modal>
            )}


            <div className="text-white pr-5">
                <button
                    className="
                        relative inline-flex items-center justify-center
                        px-4 py-2 rounded-lg
                        hover:cursor-pointer
                        bg-brand-yellow text-brand-green
                        transition-transform duration-100 ease-out
                        shadow-[0_6px_0_rgba(0,0,0,0.25)]
                        hover:translate-y-[1px] hover:shadow-[0_5px_0_rgba(0,0,0,0.25)]
                        active:translate-y-[2px] active:shadow-[0_0_0_rgba(0,0,0,0.25)]
                        focus:outline-none focus:ring-2 focus:ring-brand-yellow/60
                      "
                    onClick={user ? signOutUser: ()=>setShowModal(true)}
                >
                    <p className="font-semibold">
                        {user ? "Log Out": "Sign Up" }
                    </p>
                </button>
            </div>
        </div>


    );
};

export default NavBar;
