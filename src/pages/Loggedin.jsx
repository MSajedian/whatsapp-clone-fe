import "bootstrap/dist/css/bootstrap.min.css";
import "react-chat-elements/dist/main.css";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Chats from "../components/Chats.jsx";
import ChatPannel from "../components/ChatPannel.jsx";
import Profile from "./Profile";
import TopRight from "../components/TopRight";
import TopLeft from "../components/TopLeft";
import { io } from "socket.io-client";
import { useTransition, animated } from "react-spring"

const ApiUrl = process.env.REACT_APP_API_LOCAL_URL || process.env.REACT_APP_API_REMOTE_URL;
const socket = io(ApiUrl, { transports: ["websocket"] });

function Home({ routerProps }) {

    const [showProfile, setShowProfile] = useState(false)
    const [user, setuser] = useState(null)
    const [dataSource, setDataSource] = useState(null)
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [chats, setChats] = useState(null)

    const [chatHistoryFromServer, setChatHistoryFromServer] = useState(null)

    // const token = localStorage.getItem("accessToken")
    // const username = localStorage.getItem("username")

    const id = localStorage.getItem("id")

    useEffect(() => {
        fetchUserData()
        getRooms();
        socket.on("connect", () => { });
        socket.emit("did-connect", id)
        socket.on("message", (message) => {
            setChatHistoryFromServer((chatHis) => [...chatHis, message]);
            console.log('chatHis:', chatHistoryFromServer)
        });

        return () => {
            console.log("Disconnected");
            socket.disconnect(id);
        };
        // eslint-disable-next-line
    }, []);

    const transition = useTransition(showProfile, {
        from: { x: -100, y: 0, opacity: 0, },
        enter: { x: 0, y: 0, opacity: 1 },
        leave: { x: -100, opacity: 0 },
        delay: 100
    })

    const setRoomForUser = async (u) => {
        console.log('u:', u)
        const response = await fetch(`${ApiUrl}/room/user/${u.id}`, {
            method: "GET",
            headers: {
                authorization: `Bearer ${localStorage.getItem("accessToken")}`
            }
        })
        if (response.ok) {
            const room = await response.json();
            console.log('room:', room)
            socket.emit("join-room", room._id);
            if (room._id) {
                // const test = room.members.filter(item => { if (item._id !== id) return item.username })
                const roomName = room.members.filter(item => (item._id !== id))
                console.log('roomName:', roomName)

                setSelectedRoom(null)
                setSelectedRoom({ ...room, title: roomName[0].username })
                setChatHistoryFromServer([])
                setChatHistoryFromServer(room.chatHistory);
                window.location.reload();
                // getRooms()
                // fetchUserData()
            }
        }
    }

    const setRoom = async (room) => {
        setSelectedRoom(room)
        setChatHistoryFromServer([])
        console.log('--------- room -----------')
        console.log('room:', room)
        console.log('--------------------------')
        const response = await fetch(`${ApiUrl}/room/history/${room._id}`);
        const { chatHistory } = await response.json();
        setChatHistoryFromServer(chatHistory);
    }

    const getRooms = async () => {
        const response = await fetch(`${ApiUrl}/users/me/chats`, {
            method: "GET",
            headers: {
                authorization: `Bearer ${localStorage.getItem("accessToken")}`
            }
        })

        const responseOfChats = await response.json();

        setChats(responseOfChats)

        const chatsNames = responseOfChats.map((item) => {
            return { ...item, title: item.members.filter(member => member._id !== id)[0].username, avatar: item.members.filter(member => member._id !== id)[0].avatar }
        })
        setDataSource(chatsNames)
        console.log('dataSource:', chatsNames)
    }

    const fetchUserData = async () => {
        try {
            const res = await fetch(`${ApiUrl}/users/me`, {
                method: "GET",
                headers: {
                    authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            })

            if (res.ok) {
                const data = await res.json()
                setuser(data)
                localStorage.setItem("id", data._id)
            }

        } catch (error) {
            console.log(error)
        }
    }

 

    useEffect(() => {
        fetchUserData();
        getRooms();
        // eslint-disable-next-line
    }, [showProfile])


    return (
        <div >
            <Container className="py-5 app-container" >
                <Row className="h-100 shadow-lg" >
                    <Col md={4} className="h-100 px-0 d-flex flex-column">

                        {!showProfile && user &&
                            <>
                                <TopLeft name={user.username} avatar={user.avatar} setShowProfile={setShowProfile} routerProps={routerProps} />
                                {dataSource && <Chats setRoom={setRoom} setRoomForUser={setRoomForUser} dataSource={dataSource ? dataSource : []} />}
                            </>
                        }

                        {/* {showProfile && <Profile show={showProfile} setShowProfile={setShowProfile} />
                        } */}
                        {transition((style, item) =>
                            item ? <animated.div className={`h-100 stone-background`} style={style} ><Profile show={showProfile} setShowProfile={setShowProfile} /> </animated.div> : null
                        )}

                    </Col>
                    <Col md={8} className="px-0 h-100 d-flex flex-column" >

                        <TopRight selectedRoom={selectedRoom} />

                        <ChatPannel chats={chats} chatHistoryFromServer={chatHistoryFromServer} selectedRoom={selectedRoom} />

                    </Col>
                </Row>

            </Container >


            <div className="green-banner">

            </div>

        </div>

    );
}

export default Home;
