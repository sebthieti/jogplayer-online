jogplayer-online
================
Create Service:
sc.exe create MongoDB binPath= "\"C:\_EXTRA_SOFTS\MongoDB\mongod.exe\" --service --rest --httpinterface --config=\"C:\_EXTRA_SOFTS\MongoDB\mongod.cfg\"" DisplayName= "MongoDB 2.6 Standard" start= "auto"

Start it:
net start MongoDB