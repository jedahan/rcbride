Bridge for limited network/json devices to query rc api

    source .env
    sudo RC_TOKEN=RC_TOKEN node index.js

    echo "all|crypto" | nc localhost 8888

returns 'name,batch,phone_number,email\r' per profile
