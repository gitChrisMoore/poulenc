import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import {v4 as uuid} from 'uuid'
import { useRemoteEvents } from '../../contexts/RemoteEventProvider';

async function makeTx(oldTransaction, status, transaction_detail) {
        
    let tx = oldTransaction

    if(status === 'PENDING_APPROVAL') {
        tx.transaction_id = uuid();
        tx.transaction_state = 500;
        tx.status = 'PENDING_APPROVAL'
    } else if (status === 'APPROVED') {
        tx.transaction_state = 1500;
        tx.status = 'APPROVED';
    } else if (status === 'FINAL') {
        tx.transaction_state = 2500;
        tx.status = 'FINAL';
    } else if (status === 'NON_SUFFICIENT_FUNDS') {
        tx.transaction_state = 2000;
        tx.status = 'NON_SUFFICIENT_FUNDS';
    }
    
    if (transaction_detail) {
        tx.transaction_detail = transaction_detail
    }

    delete tx.id
    delete tx.inserted_at
    delete tx.effective_date

    return tx

}

const getTxByStatus = async (status) => {

    let {data, error} = await supabase
        .from('transactions')
        .select("*")
        .eq('status', status)
        .eq('processed', false)
        .order("id", { ascending: false })
    if (error) console.log('error - ', error)
    if (data.length > 0) {
        return data
    } else {
        return []
    }
};

const getPendingApproval = async () => {
    const res = await getTxByStatus("PENDING_APPROVAL");
    return res
};

const getApprovedTxs = async () => {
    const res = await getTxByStatus('APPROVED');
    return res
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
    }
};


async function createTx(tx) {
        
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
    }

}

const updateToProcessed = async (tx) => {
        
    let {data, error} = await supabase
        .from("transactions")
        .update({ processed: true})
        .match({ id: tx.id })
        .select("*")
        .eq('id', tx.id)
        .limit(1);
    if (error) console.log('error - ', error)
    if (data.length > 0) {
        // console.log("found data, ", data)
        return data[0]
    }
    
};

const validatePriorTxState = async (tx, state) => {
    // take prior tx and state value

    const priorTx = await getStateByID(tx);
    if (priorTx.transaction_state === state) {
        return priorTx
    }
    console.log('Transaction state error - ', priorTx)
    return null
}

const handleTxExecution = async (priorTx, status) => {

    const udpated = await updateToProcessed(priorTx);
    const tx = await makeTx(priorTx, status);
    const res = await createTx(tx);

    if(udpated && res) {
        return res
    } else {
        console.log('createApproved Failed')
    }

}


const createApproved = async (oldTransaction) => {

    const priorTx = await validatePriorTxState(oldTransaction, 500);
    if (!priorTx) return priorTx
    
    const res = await handleTxExecution(priorTx, 'APPROVED');
    console.log('createApproved Log, ', res)
    return res
};


export const TxEventHandler = () => {
    const [ buffer, setBuffer ] = useState([])
    const [ isLoading, setIsLoading ] = useState(false)
    const { message } = useRemoteEvents();


    useEffect(() => {
        // Add incoming messages to buffer, no more than 5

        if (message && buffer.length <= 3) {
            setBuffer([...buffer, message]);
        } else {
            console.log("buffer > 3, loopguard: ", buffer)
        };    

    }, [message]);

    useEffect(() => {

        if(!isLoading && buffer.length>0 ) {
            setIsLoading(true)
            console.log('Buffer size, ', buffer)
            IterationHandler()
        }

    }, [buffer]);

    const onReduceBuffer = async (msg) => {
        
        console.log('msg.new.id', msg.new.id)
        const newBuffer = buffer.filter(element => element.new.id !== msg.new.id);
        console.log('setting net Buffer', newBuffer)
        setBuffer(newBuffer);
        console.log('buffer ', buffer)
    }

    const IterationHandler = async () => {

        const routines = buffer

        for (const msg of routines) {
            console.log("Buffer item, ", msg)

            const pending_txs = await getPendingApproval();
            for (const tx of pending_txs) {
                // console.log('pending tx ', tx)
                handlePendingApproval(tx)
            }

            onReduceBuffer(msg);
        }
        setIsLoading(false)
        console.log("Done with IterationHandler, number of buffer, ", buffer);
    };

    const handlePendingApproval = async (tx) => {

        if(tx.status === "PENDING_APPROVAL" && tx.created_by === tx.user_id) {
            // console.log('passed pending approvals')
            createApproved(tx)
        } else {
            console.log('failed pending approvals')
        }

    };
    
    return (
        <> {buffer.length}
        </>
        
    )

};