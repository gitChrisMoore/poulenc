import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import {v4 as uuid} from 'uuid'
import { useRemoteEvents } from '../../contexts/RemoteEventProvider';

const getTxByStatus = async (status) => {

    let {data, error} = await supabase
        .from('transactions')
        .select("*")
        .eq('status', status)
        .eq('processed', false)
        .order("id", { ascending: true })
    if (error) console.log('error - ', error)
    if (data.length > 0) {
        return data
    } else {
        return null
    }
};

const getStateByID = async (tx) => {

    let {data, error} = await supabase
        .from('transactions')
        .select("*")
        .order("transaction_state", { ascending: false })
        .eq('transaction_id', tx.transaction_id)
        .limit(1)
    if (error) console.log('error - ', error)
    if (data.length > 0) {
        // console.log("found data, ", data)
        return data[0]
    } else {
        console.log("getStateByID - no results found")
        return null
    }
};

const updateToProcessed = async (tx, flag) => {
        
    let {data, error} = await supabase
        .from("transactions")
        .update({ processed: flag})
        .match({ id: tx.id })
        .select("*")
        .eq('id', tx.id)
        .limit(1);
    if (error) console.log('error - ', error)
    if (data.length > 0) {
        // console.log("found data, ", data)
        return data[0]
    } else {
        console.log("updateToProcessed - no results found")
        return null
    }
    
};

async function createTx(tx, state, status) {
    
    try {
        delete tx.id
        delete tx.inserted_at
        delete tx.effective_date
        tx.transaction_state = state;
        tx.status = status;

    } catch (error) {
        throw new Error('createTx error creating tx, ', error)
    }


    let { data, error } = await supabase
        .from("transactions")
          .insert(tx)
          .single();
    if (error) {
        console.log("createTx - error - : ", error);
        console.log(error)
    } else if (data) {
        console.log('createTx - success - ', data)
        return data
    } else {
        console.log("createTx - no results found")
        return null
    }
}

const getCurrentBalanceByUserID = async (id) => {

    let {data, error} = await supabase
        .from('current_balance')
        .select("*")
        .eq('user_id', id)
        .single()
    if (error) console.log('getCurrentBalanceByUserID - error ', error)
    if (data) {
        return data
    } else {
        return null
    }
};


const createTransactionWrapper = async (transaction, tx_detail, tx_status, current_tx, future_tx, payment=false) => {
    const validTx = await getStateByID(transaction)
    
    if (validTx.transaction_state !== current_tx) {
        return console.log('createFinal - invalid tx state')
    }
    const updated = await updateToProcessed(validTx, true)
    if (!updated) return console.log('createFinal - could not update tx')

    validTx.transaction_detail = tx_detail
    if(payment) validTx.amount = validTx.amount*-1

    const newTx = await createTx(validTx, future_tx, tx_status)

    if(newTx) return newTx
    else return new Error('createFinal - error - creating Tx, ', newTx)
}


export const TxEventHandler = () => {
    const { message } = useRemoteEvents();
    const [isIdle, setIsIdle] = useState(true);


    const handlePendingApprovalTxs = async () => {
        
        const resTxs = await getTxByStatus("PENDING_APPROVAL")
        if(!resTxs) return console.log('handlePendingApprovalTxs - PENDING_APPROVAL - null')

        for (const resTx of resTxs) { 
            if(resTx.status === "PENDING_APPROVAL" && resTx.type === "FUNDS_ADD" && resTx.created_by === resTx.user_id) {
                // await createApproved(resTx).catch(error => console.error('handlePendingApprovalTxs - caugh error, ', error));
                
                const res = await createTransactionWrapper(resTx, "SELF_APPROVED", "APPROVED", 500, 1500);
                console.log ("SELF_APPROVED, ", res)
            }
        }
        return resTxs
    };

    const handleApprovedTxs = async () => {
        
        const Txs = await getTxByStatus("APPROVED")
        if(!Txs) return console.log('handlePendingApprovalTxs - APPROVED - null')

        for (const tx of Txs) {
            const position = await getCurrentBalanceByUserID(tx.user_id);

            if (!position && tx.type === "FUNDS_ADD") { 
                const res = await createTransactionWrapper(tx, "NEW_ACCOUNT", "FINAL", 1500, 2500);    
                console.log ("NEW_ACCOUNT, ", res)

            } else if (position && tx.type === "FUNDS_ADD") {
                const res = await createTransactionWrapper(tx, "FUNDS_ADD", "FINAL", 1500, 2500);    
                console.log ("FUNDS_ADD, ", res)

            } else if (position.current_balance >= tx.amount && tx.type === "INVOICE") {
                const res = await createTransactionWrapper(tx, "PAYMENT", "FINAL", 1500, 2500, true);                
                console.log ("PAYMENT, ", res)

            } else if (position.current_balance < tx.amount && tx.type === "INVOICE") {
                const res = await createTransactionWrapper(tx, "PAYMENT", "NON_SUFFICIENT_FUNDS", 1500, 2000);                
                console.log ("NON_SUFFICIENT_FUNDS, ", res)
                
            } else {
                console.log("ERROR handleApprovedUsecase - Unknown Usecase")
                console.log('transaction,', tx )
                console.log('current_balance,', position )
            }
        }
        return null
    };



    useEffect(() => {
        const handleMessageTriggers = async () => {

            const pendingApprovalTxs = await handlePendingApprovalTxs()
            const approvedTxs = await handleApprovedTxs()
            console.log("done with handleMessageTriggers")
            return setIsIdle(true)
        };
        
        if(message && isIdle) {
            setIsIdle(false)
            handleMessageTriggers()
        }
    }, [message]);

    return (
        <>
        </>
        
    )

};