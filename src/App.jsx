import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  text-align: center;
  color: #1a73e8;
  margin-bottom: 20px;
`;

const MessageList = styled.div`
  height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const Message = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  flex-direction: ${props => props.$isSent ? 'row-reverse' : 'row'};
  justify-content: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div`
  padding: 8px 12px;
  border-radius: 15px;
  max-width: 70%;
  word-wrap: break-word;
  margin: ${props => props.$isSent ? '0 10px 0 0' : '0 0 0 10px'};
  ${props => props.$isSent ? `
    background-color: #0084ff;
    color: white;
    align-self: flex-end;
  ` : `
    background-color: #f0f0f0;
    color: #000;
    align-self: flex-start;
  `}
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e4e6eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #65676b;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #1a73e8;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
  &:hover {
    background-color: #1557b0;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const LoginForm = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const UserList = styled.div`
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
`;

const Username = styled.span`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  display: block;
`;

const App = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const messageListRef = useRef(null);

  useEffect(() => {
    const newSocket = io(process.env.NODE_ENV === 'production'
      ? 'https://socketio-minimal-demo.vercel.app'
      : 'http://localhost:5000');

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('user joined', ({ username: joinedUser, users: userList }) => {
      setUsers(userList);
      setMessages(prev => [...prev, { 
        text: `${joinedUser} joined the chat`, 
        system: true 
      }]);
    });

    newSocket.on('user left', ({ username: leftUser, users: userList }) => {
      setUsers(userList);
      setMessages(prev => [...prev, { 
        text: `${leftUser} left the chat`, 
        system: true 
      }]);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('chat message', ({ text, username: msgUsername }) => {
      setMessages(prev => [...prev, { 
        text, 
        sent: msgUsername === username,
        username: msgUsername
      }]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() && socket) {
      socket.emit('user join', username);
      setIsLoggedIn(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit('chat message', inputMessage);
      setInputMessage('');
    }
  };

  if (!isLoggedIn) {
    return (
      <Container>
        <Title>Join Chat</Title>
        <LoginForm>
          <Form onSubmit={handleLogin}>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              disabled={!connected}
            />
            <Button type="submit" disabled={!connected || !username.trim()}>
              Join
            </Button>
          </Form>
        </LoginForm>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Chat Box</Title>
      <UserList>
        Online Users: {users.join(', ')}
      </UserList>
      <MessageList ref={messageListRef}>
        {messages.map((msg, index) => (
          <div key={index}>
            {!msg.system && (
              <Message $isSent={msg.sent}>
                {!msg.sent && (
                  <Avatar>
                    {msg.username ? msg.username[0].toUpperCase() : '?'}
                  </Avatar>
                )}
                <MessageContent $isSent={msg.sent}>
                  {msg.text}
                </MessageContent>
                {msg.sent && (
                  <Avatar>
                    {username[0].toUpperCase()}
                  </Avatar>
                )}
              </Message>
            )}
            {msg.system && (
              <div style={{ textAlign: 'center', color: '#65676b', margin: '10px 0', fontSize: '12px' }}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </MessageList>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <Button type="submit" disabled={!connected || !inputMessage.trim()}>
          Send
        </Button>
      </Form>
    </Container>
  );
};

export default App;