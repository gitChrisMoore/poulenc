import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'

const RemoteEventContext = createContext()

export const RemoteEventProvider = ({ children }) => {
    const [message, setMessage] = useState();
    const subscriptions = supabase.getSubscriptions()

    function handleNewMessage(msg) {
        try {
            if(msg.new) {
                // console.log("setMessage, ", msg)
                setMessage(msg)
                return
            }
        } catch (error) {
            console.log("RemoteEventProvider - handleNewMessage - error, ", error)
            return
        }
    };

    async function setupListener() {

        if (subscriptions.length > 1) {
            console.log("subscription exists: ")
        } else {
            console.log("setting up subscription ")
                let { data, error } = supabase
                    .from("transactions")
                    .on("*", (res) => {
                        if (error) console.log(error);
                        // console.log(res)
                        handleNewMessage(res)
                    })
                    .subscribe();
                if (error) {
                    console.log("subscription error: ", error);
                } else if (data) {
                    console.log("subscription created: ", data)
                }
        }
    };
    
    async function handleSubscriptionRemoval() {

        for (const item of subscriptions) {
            if(item.state === 'closed') {
                // console.log("subscription state closed: ", item)
                supabase.removeSubscription(item);
            }
        }

    };

    useEffect(() => {
        setupListener()

        return () => {
            handleSubscriptionRemoval()
          };
    });

    const value = {
        message
      }
    
    return (
        <RemoteEventContext.Provider value={value}>
          {children}
        </RemoteEventContext.Provider>
    )

};

export function useRemoteEvents() {
    return useContext(RemoteEventContext)
}