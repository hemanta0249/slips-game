import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom'
import NameModal from './NameModal';

const Home = () => {

    const balloonContainerRef = React.useRef(null);

    function random(num) {
        return Math.floor(Math.random() * num);
    }

    function getRandomStyles() {
        const r = random(255);
        const g = random(255);
        const b = random(255);
        const mt = random(200);
        const ml = random(50);
        const dur = random(5) + 5;
        return `
            background-color: rgba(${r},${g},${b},0.7);
            color: rgba(${r},${g},${b},0.7);
            box-shadow: inset -7px -3px 10px rgba(${r - 10},${g - 10},${b - 10},0.7);
            margin: ${mt}px 0 0 ${ml}px;
            animation: float ${dur}s ease-in infinite
        `;
    }

    function createBalloons(num) {
        if (balloonContainerRef.current) {
            for (let i = num; i > 0; i--) {
                const balloon = document.createElement('div');
                balloon.className = 'balloon';
                balloon.style.cssText = getRandomStyles();
                balloonContainerRef.current.append(balloon);
            }
        }
    }

    function removeBalloons() {
        if (balloonContainerRef.current) {
            balloonContainerRef.current.style.opacity = 0;
            setTimeout(() => {
                if (balloonContainerRef.current) {
                    balloonContainerRef.current.innerHTML = '';
                    balloonContainerRef.current.style.opacity = 1;
                }
            }, 500);
        }
    }






    const socket = useMemo(() => io('https://alerts.socceryou.ch/'), []);

    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'];

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [modalOpen, setModalOpen] = useState(true);
    const [users, setUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const time = `${formattedHours}:${formattedMinutes} ${period}`;

    const room = 'chatRoom';

    const [firstUser, setFirstUser] = useState(null);

    const [myRole, setMyRole] = useState(null);

    const [rolesArray, setRolesArray] = useState(null);

    const [showBallons, setShowBallons] = useState(true);

    useEffect(() => {
        if (!modalOpen) {
            socket.emit('join room', room);



            socket.onAny((event, ...args) => {
                console.log('Received event:', event, args);

                if (event === 'chat-message') {
                    const [data] = args;
                    const { message, userid } = data;
                    const newMessage = { type: 'other', text: message, sender: userid };
                    setMessages(prevMessages => [...prevMessages, newMessage]);

                    setNotifications(prevNotifications => [
                        ...prevNotifications,
                        { type: 'message', text: `${userid} sent you a new message` }
                    ]);
                }

                else if (event === 'user-joined') {
                    const [data] = args;
                    const { userid } = data;

                    // Check if user is already in the list
                    if (!users.find(user => user.userid === userid)) {
                        const newUser = { userid, message: `${userid} joined the ${room}` };
                        setUsers(prevUsers => [...prevUsers, newUser]);

                        setNotifications(prevNotifications => [
                            ...prevNotifications,
                            { type: 'join', text: `${userid} joined the ${room}` }
                        ]);
                    }
                }
            });

            socket.on('getUser', ({ name, id }) => {
                if (id === 1) {
                    setFirstUser(name);
                }
            })

            socket.on('roles-assigned', ({ name, role }) => {
                console.log("role is here", name, role);
                setMyRole(role);
                // socket.emit('reveal-role');
                // setUserRoles(prevRoles => ({
                //     ...prevRoles,
                //     ...roles
                // }));
            });

            socket.on('reveal-role', (assignedRolesArray) => {
                console.log("new data", assignedRolesArray);
                setRolesArray(assignedRolesArray);
            })

            socket.on("getSelectedRole", (role)=>{
                console.log(role);
                if(role==='thief'){
                    alert(`soldier got 800 points, because he had selected the role - ${role}`);
                }
                else{
                    alert(`soldier got 0 points, because he had selected the role - ${role}`);
                }
            })

            return () => {
                socket.offAny();
                socket.off('getUser');
                socket.off('roles-assigned');
                socket.off('reveal-role');
                socket.off('getSelectedRole');
            };
        }
    }, [modalOpen, users, socket, firstUser]);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() !== '') {
            const newMessage = { type: 'user', text: message };
            setMessages(prevMessages => [...prevMessages, newMessage]);
            setMessage('');
            socket.emit('chat-message', { room, message });
        }
    };

    const handleNameSubmit = (name) => {
        socket.emit('set-name', name);
        setCurrentUser(name);
        setModalOpen(false);
    };



    // const renderGrid = () => {
    //     return (
    //         <div className="grid">
    //             {users.slice(0, 4).map((user, index) => (
    //                 <div key={user.userid} className="grid-cell" style={{ backgroundColor: colors[index] }}>
    //                     {user.userid}
    //                 </div>
    //             ))}
    //         </div>
    //     );
    // };



    const [currentUser, setCurrentUser] = useState(null);
    const [userRoles, setUserRoles] = useState({});

    const roles = ['king', 'thief', 'minister', 'soldier'];

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    };

    const revealRole = () => {
        if (myRole) {
            socket.emit('reveal-role', myRole);
        }
    }

    const assignRoles = () => {

        // Shuffle the roles array
        const shuffledRoles = shuffleArray([...roles]);

        // const newRoles = {};
        // users.forEach((user, index) => {
        //     newRoles[user.userid] = shuffledRoles[index % shuffledRoles.length];
        // });

        // setUserRoles(newRoles);
        socket.emit('roles-assigned', shuffledRoles); // Emit roles to other users

    };

    // const assignRoles = () => {
    //     const newRoles = {};
    //     users.forEach(user => {
    //         const randomRole = roles[Math.floor(Math.random() * roles.length)];
    //         newRoles[user.userid] = randomRole;
    //     });
    //     setUserRoles(newRoles);
    //     // Notify other users
    //     socket.emit('roles-assigned', newRoles);
    // };

    const handleSelectRole = (role) => {
        if (role === 'thief') {
            createBalloons(300);
            setShowBallons(false);
            setTimeout(() => {
                removeBalloons();
                setShowBallons(true)
            }, 5000);
        }
        else {
            alert("you selected wrong player");
        }
        socket.emit("selectRole", role);
    }


    const renderGrid = () => {
        // Create a new array with the current user at the top
        const sortedUsers = currentUser ? [{ userid: currentUser }, ...users.filter(user => user.userid !== currentUser)] : users;

        return (

            <div className="row" style={{ height: "100%" }}>

                <div className="col-6">

                    <div className="grid" style={{ height: "100%", position: "relative" }}>
                        {sortedUsers.slice(0, 4).map((user, index) => {
                            const userRole = rolesArray?.find(roleObj => roleObj.name === user.userid)?.role;

                            return (
                                <div key={user.userid} className="grid-cell" style={{ backgroundColor: colors[index] }}>
                                    {user.userid}
                                    <br />
                                    {myRole && index === 0 && myRole}
                                    {userRole && index !== 0 && (
                                        <div className="slip">
                                            <div className={`${myRole === 'soldier' && (userRole === 'thief' || userRole === 'minister') && 'd-none'}`}>
                                                {userRole}
                                            </div>
                                            <button className={`btn btn-danger ${(myRole !== 'soldier' || userRole === "king") && 'd-none'}`} onClick={() => handleSelectRole(userRole)} >select</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {currentUser === firstUser && (
                            <button className="circle-button btn btn-success p-0" onClick={assignRoles}>
                                click
                            </button>
                        )}
                    </div>



                    {/* <div className="grid" style={{height:"100%"}}>
                        {sortedUsers.slice(0, 4).map((user, index) => (
                            <div key={user.userid} className="grid-cell" style={{ backgroundColor: colors[index] }}>
                                {user.userid}
                            </div>
                        ))}
                    </div> */}
                </div>
            </div>
        );
    };

    return (

        <div>
            <div className={showBallons && `d-none`} ref={balloonContainerRef} id="balloon-container" style={{ position: "absolute", width: "100%", zIndex: "1" }} ></div>
            {modalOpen && <NameModal onSubmit={handleNameSubmit} />}
            {!modalOpen && (
                <div>
                    <section className="message-area">
                        <div className="container">
                            <div className="row">
                                <div className="col-12">
                                    <div className="chat-area">
                                        <div className="chatlist d-none d-md-block">
                                            <div className="modal-dialog-scrollable">
                                                <div className="modal-content">
                                                    <div className="chat-header">
                                                        {/* <div className="msg-search"> */}
                                                        <h2 style={{ textAlign: "center" }}>Notifcations</h2>
                                                        {/* <Link className="add" to='/'><img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/add.svg" alt="add" /></Link> */}
                                                        {/* </div> */}
                                                    </div>
                                                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                                                        <li className="nav-item" role="presentation">
                                                            <button className="nav-link active" id="Open-tab" data-bs-toggle="tab" data-bs-target="#Open" type="button" role="tab" aria-controls="Open" aria-selected="true">Open</button>
                                                        </li>
                                                    </ul>

                                                    <div className="modal-body">
                                                        <div className="chat-lists" style={{ padding: "10px 0" }}>
                                                            <div className="tab-content" id="myTabContent">
                                                                <div className="tab-pane fade show active" id="Open" role="tabpanel" aria-labelledby="Open-tab">
                                                                    <div className="chat-list">
                                                                        {notifications.map((notif, index) => (
                                                                            <div key={index} className="notifications">

                                                                                <div className="flex-grow-1 ms-3">
                                                                                    <h3>New Notification</h3>
                                                                                    <p>{notif.text}</p>
                                                                                </div>

                                                                            </div>
                                                                        ))}

                                                                    </div>
                                                                </div>
                                                                <div className="tab-pane fade" id="Closed" role="tabpanel" aria-labelledby="Closed-tab">

                                                                    <div className="chat-list">
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                                <span className="active"></span>
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Mehedi Hasan</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Ryhan</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Malek Hasan</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Sadik Hasan</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Bulu </h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Maria SK</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Dipa Hasan</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Jhon Hasan</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Tumpa Moni</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Payel Akter</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Baby Akter</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Zuwel Rana</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Habib </h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Jalal Ahmed</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Hasan Ali</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>
                                                                        <Link to='/' className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0">
                                                                                <img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/user.png" alt="user img" />
                                                                            </div>
                                                                            <div className="flex-grow-1 ms-3">
                                                                                <h3>Mehedi Hasan</h3>
                                                                                <p>front end developer</p>
                                                                            </div>
                                                                        </Link>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="chatbox">
                                            <div className="modal-dialog-scrollable">
                                                <div className="modal-content">
                                                    <div className="msg-head">
                                                        <div className="row">
                                                            <div className="col-8">
                                                                <div className="d-flex align-items-center">
                                                                    <span className="chat-icon"><img className="img-fluid" src="https://mehedihtml.com/chatbox/assets/img/arroleftt.svg" alt="image_title" /></span>

                                                                    <div className="flex-grow-1 ms-3">
                                                                        <h3>Group Chat</h3>
                                                                        <p>demo chat</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-4">
                                                                <ul className="moreoption">
                                                                    <li className="navbar nav-item dropdown">
                                                                        <Link className="nav-link dropdown-toggle" to='/' role="button" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" aria-hidden="true"></i></Link>
                                                                        <ul className="dropdown-menu">
                                                                            <li><Link className="dropdown-item" to='/'>Action</Link></li>
                                                                            <li><Link className="dropdown-item" to='/'>Another action</Link></li>
                                                                            <li>
                                                                                <hr className="dropdown-divider" />
                                                                            </li>
                                                                            <li><Link className="dropdown-item" to='/'>Something else here</Link></li>
                                                                        </ul>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="modal-body">

                                                        {renderGrid()}

                                                        {/* <div className="msg-body">
                                                            <ul>



                                                                {messages.map((msg, index) => (
                                                                    <li key={index} className={msg.type === 'user' ? 'repaly' : 'sender'}>
                                                                        <p>{msg.text}</p>
                                                                        <span className="time">{time}</span>
                                                                        <span className="user time">sent by: {msg.sender}</span>
                                                                    </li>
                                                                ))}

                                                            </ul>
                                                        </div> */}

                                                    </div>

                                                    <div className="send-box">

                                                        <form onSubmit={handleSubmit}>
                                                            <input type="text" value={message} className="form-control" onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." />

                                                            <button type="submit"><i className="fa fa-paper-plane"></i> Send</button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>

    )
}



const styles = `
.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    position: relative;
}

.grid-cell {
    padding: 20px;
    text-align: center;
    color: white;
    font-weight: bold;
    border-radius: 5px;
}

.circle-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #3498db;
    color: white;
    border: none;
    font-size: 16px;
    cursor: pointer;
}

.slip {
    margin-top: 10px;
    padding: 5px;
    background: #fff;
    color: #000;
    border-radius: 5px;
    display: inline-block;
}
`;


// const styles = `
// .grid {
//     display: grid;
//     grid-template-columns: repeat(2, 1fr);
//     gap: 10px;
// }
// .grid-cell {
//     padding: 20px;
//     text-align: center;
//     color: white;
//     font-weight: bold;
// }
// `;

export default Home