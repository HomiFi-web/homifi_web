import React from 'react';
import './RoomCard.css'; // Import the RoomCard styling

const RoomCard = ({ room }) => {
  return (
    <div className="room-card">
      <img src={room.image} alt={room.name} className="room-image" />
      <div className="room-info">
        <h3>{room.name}</h3>
        <span className="tag">{room.tag}</span>
        <p>{room.description}</p>
        <p>Price: {room.price}</p>
      </div>
    </div>
  );
};

export default RoomCard;
