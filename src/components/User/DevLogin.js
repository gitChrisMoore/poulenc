import * as React from 'react';
import { useAuth } from '../../contexts/Auth'

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

export function DevLogin() {
    const { user, signIn, signOut } = useAuth()


    async function handleSignIn() {
        // e.preventDefault()
        const email = 'tmpTx@gmail.com'
        // const email = 'chrisdmoore06@gmail.com'
        const password = 'abcd1234'
        // console.log(un)
        const { error } = await signIn({ email, password })
    
        if (error) {
          alert('error signing in')
          console.log(error)
        }
    }

    async function handleSignOut() {
        signOut()
    }

  return (
    <div>
        <Grid display= 'flex' p={2}>
        <Box sx={{ flexGrow: 1 }} >
        <Paper
                  sx={{
                    p: 1,
                    md: 8,
                  }}
        >
        <List
            subheader={
                <ListSubheader component="div" id="nested-list-subheader">
                Login Information
                </ListSubheader>
            }
        >
            <Divider />
            <ListItem button key='1'>
                <ListItemText primary={user?.id} />
            </ListItem>
            <Divider />
            <ListItem button key='2' onClick={handleSignOut}>
                <ListItemText primary='Sign Out' />
            </ListItem>
            <ListItem button key='3' onClick={handleSignIn}>
                <ListItemText primary='Sign In' />
            </ListItem>
            
            <Divider />
        </List>
        </Paper>
        </Box>
        </Grid>
    </div>
  );
}