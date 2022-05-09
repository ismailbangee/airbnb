    import React from "react";
    import "./Rentals.css";
    import { Link } from "react-router-dom";
    import { useLocation } from "react-router";
    import logo from "../images/airbnbRed.png";
    import RentalsMap from "../components/RentalsMap";
    import { useEffect, useState } from "react";
    import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
    // Add useNotification to our imports
    import { ConnectButton, Icon, Button, useNotification } from "web3uikit";
// We need to add User.js to our imports
import User from "../components/User";
    const Rentals = () => {
    const { state: searchFilters } = useLocation();
    const [highLight, setHighLight] = useState();
    const { Moralis, account } = useMoralis();
    const [rentalsList, setRentalsList] = useState();
    const [coOrdinates, setCoOrdinates] = useState([]);
    const contractProcessor = useWeb3ExecuteFunction();
    const dispatch = useNotification();
    const bookRental = async function (start, end, id, dayPrice) {
    // so we need to update out useMoralis hook by adding account to what we
// need from there
        // Arrays of strings and dates that we want to book for in the 
        // format yyyy-mm-dd.
        for (
          var arr = [], dt = new Date(start);
          dt <= end;
          dt.setDate(dt.getDate() + 1)
        ) {
          arr.push(new Date(dt).toISOString().slice(0, 10)); // yyyy-mm-dd
        }
    
        // Options for Moralis excecute function
        let options = {
          // Contract address for the deployed contract
          contractAddress: "0x832c79e2eF046b691Ffc9310c5c5c6127A335dC5",
    
          // Function to be executed in the contract
          functionName: "addDatesBooked",
    
          // The abi from the already saved abi.json
          abi: [
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string[]",
                        "name": "newBookings",
                        "type": "string[]"
                    }
                ],
                "name": "addDatesBooked",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            }
          ],
    
          // Parameters for the addDatesBooked as defined in the contract
          // which is also passed in this functions parameter and the arr above
          params: {
            id: id,
            newBookings: arr,
          },

         // How much matic to be paid which is the dayPrice
          msgValue: Moralis.Units.ETH(dayPrice * arr.length),
        }

    
        // This makes the communication with the options above
        await contractProcessor.fetch({
            params: options,
            onSuccess: () => {
            handleSuccess(); //This fires if the transaction goes through
            },
            onError: (error) => {
            //This fires if the transaction fail
            handleError(error.data.message)
            }
        });



        console.log(arr);
    
      }

        // We can now create our handleSuccess and handleError outsite the bookRental function
        const handleSuccess= () => {
            dispatch({
            type: "success",
            message: `Nice! You are going to ${searchFilters.destination}!!`,
            title: "Booking Succesful",
            position: "topL",
            });
        };

        const handleError= (msg) => {
            dispatch({
            type: "error",
            message: `${msg}`,
            title: "Booking Failed",
            position: "topL",
            });
        };

        const handleNoAccount= () => {
            dispatch({
              type: "error",
              message: `You need to connect your wallet to book a rental`,
              title: "Not Connected",
              position: "topL",
            });
          };

    useEffect(() => {
        async function fetchRentalsList() {
        const Rentals = Moralis.Object.extend("Rentals");
        const query = new Moralis.Query(Rentals);
        query.equalTo("city", searchFilters.destination);
        query.greaterThanOrEqualTo("maxGuests_decimal", searchFilters.guests);

        const result = await query.find();

        let cords = [];
        result.forEach((e) => {
            cords.push({ lat: e.attributes.lat, lng: e.attributes.long });
        });

        setCoOrdinates(cords);
        setRentalsList(result);
        }

        fetchRentalsList();
    }, [searchFilters]);

    return (
        <>
            <div className="topBanner">
                <div>
                <Link to="/">
                    <img className="logo" src={logo} alt="logo"></img>
                </Link>
                </div>
                <div className="searchReminder">
                <div className="filter">{searchFilters.destination}</div>
                <div className="vl" />
                <div className="filter">
                    {`
                ${searchFilters.checkIn.toLocaleString("default", {
                    month: "short",
                })} 
                ${searchFilters.checkIn.toLocaleString("default", {
                    day: "2-digit",
                })} 
                - 
                ${searchFilters.checkOut.toLocaleString("default", {
                    month: "short",
                })} 
                ${searchFilters.checkOut.toLocaleString("default", {
                    day: "2-digit",
                })}
                `}
                </div>
                <div className="vl" />
                <div className="filter">{searchFilters.guests} Guest</div>
                <div className="searchFiltersIcon">
                    <Icon fill="#ffffff" size={20} svg="search" />
                </div>
                </div>
                <div className="lrContainers">
                {account &&
            <User account={account} />
          }
                <ConnectButton />
                </div>
            </div>
      <hr className="line" />
      <div className="rentalsContent">
        <div className="rentalsContentL">
          Stays Available For Your Destination
          {rentalsList &&
            rentalsList.map((e, i) => {
              return (
                <>
                  <hr className="line2" />
                  <div className={highLight == i ? "rentalDivH " : "rentalDiv"}>
                    <img className="rentalImg" src={e.attributes.imgUrl}></img>
                    <div className="rentalInfo">
                      <div className="rentalTitle">{e.attributes.name}</div>
                      <div className="rentalDesc">
                        {e.attributes.unoDescription}
                      </div>
                      <div className="rentalDesc">
                        {e.attributes.dosDescription}
                      </div>
                      <div className="bottomButton">
                        <Button
                            onClick={() => {
                            if (account) {
                                bookRental(
                                searchFilters.checkIn,
                                searchFilters.checkOut,
                                e.attributes.uid_decimal.value.$numberDecimal,
                                Number(e.attributes.pricePerDay_decimal.value.$numberDecimal)
                                );
                            } else {
                                handleNoAccount();
                            }
                            }}
                            text="Stay Here"
                        />;

                        <div className="price">
                          <Icon fill="#808080" size={10} svg="matic" />{" "}
                          {e.attributes.pricePerDay} / Day
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })}
        </div>
        <div className="rentalsContentR">
        <RentalsMap locations={coOrdinates} setHighLight={setHighLight} />
        </div>
        </div>
     </>
    );
  };
  
  export default Rentals;