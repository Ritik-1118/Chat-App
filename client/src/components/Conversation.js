import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function Conversations() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        async function fetchUsers() {
            const res = await fetch("http://127.0.0.1:8000/users/", {
                headers: {
                    Authorization: `Token ${user?.token}`
                }
            });
            const data = await res.json();
            setUsers(data);
        }
        fetchUsers();
    }, [user]);

    function createConversationName(username) {
        const namesAlph = [user?.username, username].sort();
        return `${namesAlph[0]}__${namesAlph[1]}`;
    }

    return (
        <div className="">
            <div className=" bg-gray-900 rounded">
                <h1 className="text-3xl text-center text-white px-4 py-3">Chat users</h1>
                <div className="flex justify-center mt-2">
                    <hr className="w-1/2 mb-4 mx-10 border-b-2 border-gray-500" />
                </div>
                <div className="flex justify-center ">
                    <div className="pt-4 w-full px-10 text-white rounded">
                        {users
                            .filter((u) => u.username !== user?.username)
                            .map((u) => (
                                <Link key={u.username} to={`chats/${createConversationName(u.username)}`}>
                                    <div key={u.username} className="py-2 border pl-4 my-2 mr-5 rounded-md border border-transparent bg-gray-800 py-2 px-5 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">{u.username}</div>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}