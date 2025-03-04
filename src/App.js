import './App.css';
import { Box, Button, Container, VStack, Input, HStack } from "@chakra-ui/react";
import Message from './Message/Message';
import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { app } from "./firebase";
import { useEffect, useState, useRef } from "react"; 
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";  

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("User signed in:", result.user);
    })
    .catch((error) => {
      console.error("Google Sign-In Failed:", error.message);
      alert("Google Sign-In Failed: " + error.message);
    });
};

const logoutHandler = () => signOut(auth);

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divForScroll = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"));
    
    const unsubscribeAuth = onAuthStateChanged(auth, (data) => {  
      setUser(data);
    });
    
    const unsubscribeForMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    
    return () => {
      unsubscribeAuth();
      unsubscribeForMessages();
    };
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setMessage(""); 
      divForScroll.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert(error);
    }
  };

  return (
    <Box bg="red.50">
      {user ? (
        <Container h="100vh" bg="white">
          <VStack h="full" paddingY="4">
            <Button onClick={logoutHandler} colorScheme="red" w="full">Logout</Button>
            <VStack h="full" w="full" overflowY="auto" css={{"&::-webkit-scrollbar":{
              display:"none"
            }}}>
              {messages.map((item) => (
                <Message 
                  key={item.id}
                  user={item.uid === user.uid ? "me" : "other"} 
                  text={item.text} uri={item.uri}
                />
              ))}
              <div ref={divForScroll}></div>
            </VStack>
            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="Enter a message..." bg="white" />
                <Button colorScheme="purple" type="submit">Send</Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack bg="green.100" alignItems="center" justifyContent="center" h="100vh">
          <Button onClick={loginHandler} colorScheme="purple">Sign In with Google</Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;
