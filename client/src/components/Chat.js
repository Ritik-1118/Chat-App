import React, { useContext, useState, useEffect, useRef } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import { Message } from "./Message";
import InfiniteScroll from "react-infinite-scroll-component";
import { ChatLoader } from "./ChatLoader";
import { useHotkeys } from "react-hotkeys-hook";
import { Conversations } from "./Conversation";

export function Chat() {
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [message, setMessage] = useState("");
  const { user } = useContext(AuthContext);

  const [page, setPage] = useState(2);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const [participants, setParticipants] = useState([]);

  const [conversation, setConversation] = useState(null);

  const [typing, setTyping] = useState(false);

  

  function updateTyping(event) {
    if (event.user !== user?.username) {
      setTyping(event.typing);
    }
  }

  const { conversationName } = useParams();

  const inputReference = useHotkeys(
    "enter",
    () => {
      handleSubmit();
    },
    {
      enableOnTags: ["INPUT"]
    }
  );

  const [meTyping, setMeTyping] = useState(false);
  const timeout = useRef();

  function timeoutFunction() {
    setMeTyping(false);
    sendJsonMessage({ type: "typing", typing: false });
  }

  function onType() {
    if (meTyping === false) {
      setMeTyping(true);
      sendJsonMessage({ type: "typing", typing: true });
      timeout.current = setTimeout(timeoutFunction, 5000);
    } else {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(timeoutFunction, 5000);
    }
  }

  useEffect(() => () => clearTimeout(timeout.current), []);

  useEffect(() => {
    (inputReference.current).focus();
  }, [inputReference]);

  const { readyState, sendJsonMessage } = useWebSocket(user ? `ws://127.0.0.1:8000/chats/${conversationName}/` : null, { 
  // const { readyState, sendJsonMessage } = useWebSocket(user ? `wss://bchat-4c4c.onrender.com/chats/${conversationName}/` : null, { 
  queryParams: {
      token: user ? user.token : "",
    },
    onOpen: () => {
      console.log("Connected!");
    },
    onClose: () => {
      console.log("Disconnected!");
    },
    // onMessage handler
    onMessage: (e) => {
      const data = JSON.parse(e.data);
      switch (data.type) {
        case "welcome_message":
          setWelcomeMessage(data.message);
          break;
        case "chat_message_echo":
          setMessageHistory((prev) => [data.message, ...prev]);
          sendJsonMessage({ type: "read_messages" });
          break;
        case "last_50_messages":
          setMessageHistory(data.messages);
          setHasMoreMessages(data.has_more);
          break;
        case "user_join":
          setParticipants((pcpts) => {
            if (!pcpts.includes(data.user)) {
              return [...pcpts, data.user];
            }
            return pcpts;
          });
          break;
        case "user_leave":
          setParticipants((pcpts) => {
            const newPcpts = pcpts.filter((x) => x !== data.user);
            return newPcpts;
          });
          break;
        case "online_user_list":
          setParticipants(data.users);
          break;

        case 'typing':
          updateTyping(data);
          break;

        default:
          console.error("Unknown message type!");
          break;
      }
    }
  });

  useEffect(() => {
    async function fetchConversation() {
      const apiRes = await fetch(`http://127.0.0.1:8000/conversations/${conversationName}/`, {/////////////////////////
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Token ${user?.token}`
        }
      });
      if (apiRes.status === 200) {
        const data = await apiRes.json();
        setConversation(data);
      }
    }
    fetchConversation();
  }, [conversationName, user]);


  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated"
  }[readyState];

  useEffect(() => {
    if (connectionStatus === "Open") {
      sendJsonMessage({
        type: "read_messages"
      });
    }
  }, [connectionStatus, sendJsonMessage]);

  function handleChangeMessage(e) {
    setMessage(e.target.value);
    onType();
  }

  const handleSubmit = () => {
    if (message.length === 0) return;
    if (message.length > 512) return;
    sendJsonMessage({
      type: "chat_message",
      message
    });
    setMessage("");

    clearTimeout(timeout.current);
    timeoutFunction();
  };

  async function fetchMessages() {
    const apiRes = await fetch(
      `http://127.0.0.1:8000/?conversation=${conversationName}&page=${page}`,/////////////////////////
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        }
      }
    );
    if (apiRes.status === 200) {
      const data = await apiRes.json();
      setHasMoreMessages(data.next !== null);
      setPage(page + 1);
      setMessageHistory((prev) => prev.concat(data.results));
    }
  }

  return (
    <div className="flex h-screen">
      {/* Conversation section */}
      <div className="w-1/4 bg-gray-900 p-4 rounded mr-1">
        <Conversations />
      </div>
  
      {/* Chat section */}
      <div className="w-3/4 bg-gray-300 rounded">
        {/* <div className="p-5">
          <h1>The WebSocket is currently {connectionStatus}</h1>
        </div> */}
        <div className="py-1 px-4 bg-gray-900">
          {conversation && (
            <div className="pt-2">
              <h3 className="text-3xl font-semibold text-white">
                {conversation.other_user.username}
              </h3>
              <span className="text-sm text-white">
                {participants.includes(conversation.other_user.username)
                  ? " online"
                  : " offline"}
              </span>
            </div>
          )}
        </div>
  
        <div
          id="scrollableDiv"
          className="h-[calc(100%-15rem)] mt-3 flex flex-col-reverse relative w-full border border-gray-200 overflow-y-auto p-6"
        >
          <div>
            {/* Put the scroll bar always on the bottom */}
            <InfiniteScroll
              dataLength={messageHistory.length}
              next={fetchMessages}
              className="flex flex-col-reverse" // To put endMessage and loader to the top
              inverse={true}
              hasMore={hasMoreMessages}
              loader={<ChatLoader />}
              scrollableTarget="scrollableDiv"
            >
              {messageHistory.map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </InfiniteScroll>
          </div>
        </div>
        {typing && <p className="truncate text-sm text-white">typing...</p>}
        <div className="flex w-full items-center justify-between border border-gray-200 p-3">
          <input
            type="text"
            placeholder="Message"
            className="block w-full rounded bg-gray-100 py-2 outline-none focus:text-gray-700 py-3"
            name="message"
            value={message}
            onChange={handleChangeMessage}
            required
            ref={inputReference}
            maxLength={511}
          />
          <button className="ml-3 px-3 py-3 bg-gray-300 rounded-md border border-transparent bg-sky-600 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
  
}