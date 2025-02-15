import { v4 as uuidv4 } from "uuid";
import { sendMessage, getEvent } from "./matrixClientRequests";
import { PERSON_NAME, ROLE_NAME, PSEUDO_STATE_EVENT_TYPE } from "./constants";
import { getPseudoState, setPseudoState } from "./pseudoState";

const { userId } = process.env;

const hello = async (roomId: string) => {
  sendMessage(
    roomId,
    `🤖Example Tool🤖: Hello I'm the matrix example tool. 
    I track who has been assigned roles in this group. 
    React to this message with:\n
    ❤️ to see the current assigned roles\n
    👍 to assign a role to someone`
  );
};

const feedback = async (roomId: string) => {
  sendMessage(
    roomId,
    `how was the event rate it on a scale of 1 to 5`
  );
};

const greeting = async (roomId: string) => {
  sendMessage(
    roomId,
    `welcome to the room`
  );
};

const sendPersonRequest = (roomId: string, replyText: string) => {
  sendMessage(
    roomId,
    `Quote-reply to this message with the name of the role you want to assign to ${replyText}.`,
    {
      person: {
        name: replyText,
      },
      expecting: ROLE_NAME,
    }
  );
};

const assignRole = async (
  personName: string,
  roomId: string,
  replyText: string
) => {
  let roleState = await getPseudoState(roomId, PSEUDO_STATE_EVENT_TYPE);

  if (!roleState) {
    roleState = {
      content: {
        assignedRoles: [],
      },
    };
  }

  const { assignedRoles } = roleState.content;
  assignedRoles.push({
    id: uuidv4(),
    person: {
      name: personName,
    },
    role: {
      name: replyText,
    },
  });

  setPseudoState(roomId, PSEUDO_STATE_EVENT_TYPE, { assignedRoles });

  sendMessage(roomId, `You've assigned ${personName} the role ${replyText}.`);
};

const handleReply = async (event) => {
  const roomId = event.event.room_id;
  const message = event.event.content.body;
  const replyText = message.split("\n\n")[1] || message;
  const prevEventId =
    event.event.content["m.relates_to"]["m.in_reply_to"].event_id;

  const prevEvent = (await getEvent(roomId, prevEventId)) as any;

  if (prevEvent.sender !== userId) return;

  const { expecting } = prevEvent.content.context;

  if (expecting === PERSON_NAME) {
    sendPersonRequest(roomId, replyText);
  }
  if (expecting === ROLE_NAME) {
    const personName = prevEvent.content.context.person.name;
    assignRole(personName, roomId, replyText);
  }
};

const handleMessage = async (event) => {
  const message = event.event.content.body.toLowerCase();
  const { room_id } = event.event;

  //if message is a reply, handle reply
  if (event.event.content["m.relates_to"]) {
    handleReply(event);
    return;
  }

  //if message has the tool's wake word, say hello
  if (message.includes("example")) {
    hello(room_id);
    return;
  }

  if (message.includes("feedback")) {
    feedback(room_id);
    return;
  }

};

const handlejoin = async (event) => {
 // console.log(event, "event");
 // console.log(event.type, "event type");
  console.log(event.event.unsigned.membership, "event membership");
  const { room_id } = event.event.room_id;
  const {sender} = event.event.sender;
    greeting(room_id);
};
export { handlejoin };
export default handleMessage;