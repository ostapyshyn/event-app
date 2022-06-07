import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "../../store/slices/usersSlice";


const List = () => {
    const dispatch = useDispatch();
    const { users } = useSelector(state => state.usersSlice);

    useEffect(() => {
        dispatch(getUsers());
    }, [dispatch]);

    return (
        <>
            <ul>
                {
                    users && users.map((user, idx) => (
                        <li key={user.id}>{idx + 1}. {user.name}</li>
                    ))
                }
            </ul>
        </>
    );
};

export default List;
