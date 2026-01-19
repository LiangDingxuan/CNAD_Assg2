import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

function App() {
  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Microservices App
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/account">Account</Button>
          <Button color="inherit" component={Link} to="/tasks">Tasks</Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h3" gutterBottom>
                Welcome to Microservices App
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Select a section from the navigation menu
              </Typography>
            </Box>
          } />
          {/* Add more routes as needed */}
        </Routes>
      </Container>
    </div>
  );
}

export default App;
