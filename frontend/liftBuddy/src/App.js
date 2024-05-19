import React, { useState, useEffect } from 'react'

import axios from 'axios'
import './App.css'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const LIFTDATA = require('./lift-data.json')
const LIFTS = LIFTDATA.liftData

// Initialize an agent at application startup.
const fpPromise = FingerprintJS.load()

const App = () => {
  const [selectedSkiArea, setSelectedSkiArea] = useState('')
  const [skiAreas, setSkiAreas] = useState([])
  const [liftData, setLiftData] = useState([])
  const [waitTimeData, setWaitTimeData] = useState({})
  const [uniqueID, setUniqueID] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLiftForUpdate, setSelectedLiftForUpdate] = useState(null)

  const [showThankYou, setShowThankYou] = useState(false)

  const [fadeOut, setFadeOut] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  useEffect(() => {
    // Generate a uniqueID for the user (You may want to implement this differently)

    // Fetch ski areas from your JSON data
    fetchSkiAreas()

    // Fetch initial lift data when the component mounts
    fetchLiftData(selectedSkiArea)

    // Set up interval to periodically update lift data
    const interval = setInterval(() => {
      fetchLiftData(selectedSkiArea)
    }, 10000)

    return () => {
      // Clean up the interval when the component unmounts
      clearInterval(interval)
    }
  }, [selectedSkiArea])

  useEffect(() => {
    document.title = 'LiftBuddy'
  }, [])

  const generateUniqueID = async () => {
    const fp = await fpPromise
    const result = await fp.get()
    console.log(result.visitorId)
    return result.visitorId
  }

  const fetchSkiAreas = () => {
    // Extract unique ski area names from LIFTS
    const skiAreaNames = [...new Set(LIFTS.map(item => item.skiArea))]
    setSkiAreas(skiAreaNames)
  }

  const fetchLiftData = skiArea => {
    if (!skiArea) {
      // No ski area selected, so don't fetch data
      return
    }

    axios
      .get(`http://localhost:8080/status/${skiArea}`)
      .then(response => {
        setLiftData(response.data)
        console.log(response.data)
      })
      .catch(error => {
        console.error('Error fetching lift data', error)
      })
  }

  const waitTimeMapping = {
    '0 minutes': 0,
    '1 minute': 1,
    '2 minutes': 2,
    '3 minutes': 3,
    '5 minutes': 5,
    '7 minutes': 7,
    '9 minutes': 9,
    '10 minutes': 11,
    '15 minutes': 15,
    'over 15 minutes': 20
  }

  const getColorBasedOnWaitTime = waitTime => {
    let color
    if (waitTime === null) color = '#ffffff'
    else if (waitTime === 0) color = '#28a745' // green for 0 min
    else if (waitTime <= 2) color = '#56c23d' // light green for 2 min or less
    else if (waitTime <= 4) color = '#d0e01f' // yellow for 4 min or less
    else if (waitTime <= 6) color = '#e8c40e' // yellow-orange for 6 min or less
    else if (waitTime <= 8) color = '#ff9f00' // orange for 8 min or less
    else if (waitTime <= 10) color = '#ff6f00' // deep orange for 10 min or less
    else if (waitTime <= 15) color = '#fd7e14' // orange-red for 15 min or less
    else color = '#dc3545' // red for more than 15 min

    const blurRadius = '4px'

    return {
      color: '#000',
      textShadow: `
      -0.5px -0.5px ${blurRadius} ${color},
      0.5px -0.5px ${blurRadius} ${color},
      -0.5px  0.5px ${blurRadius} ${color},
      0.5px  0.5px ${blurRadius} ${color}`
    }
  }

  const skiAreaNames = [
    'Summit Central',
    'Summit West',
    'Summit East',
    'Alpental'
  ]

  const handleSkiAreaChange = event => {
    const selectedArea = event.target.value
    if (skiAreaNames.includes(selectedArea)) {
      setSelectedSkiArea(selectedArea)
      fetchLiftData(selectedArea)
    }
  }

  const handleOpenModal = liftName => {
    setSelectedLiftForUpdate(liftName)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLiftForUpdate(null)
  }

  const handleWaitTimeUpdate = async displayedWaitTime => {
    if (!selectedLiftForUpdate) return

    axios
      .post('http://localhost:8080/update', {
        lift: selectedLiftForUpdate,
        uniqueID: await generateUniqueID(),
        waitTime: displayedWaitTime
      })
      .then(() => {
        setShowThankYou(true)

        setTimeout(() => setShowThankYou(false), 3000) // Hide the message after 3 seconds
      })
      .catch(error => {
        console.error('Error updating wait time', error)
      })
      .finally(() => {
        handleCloseModal()
      })
  }

  const items = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape'
  ]

  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearchChange = event => {
    setSearchTerm(event.target.value)
  }

  const handleDropdownClick = () => {
    setIsDropdownVisible(true)
  }

  const handleOutsideClick = event => {
    if (!event.target.closest('.dropdown')) {
      setIsDropdownVisible(false)
    }
  }

  // Add an event listener to handle outside clicks
  React.useEffect(() => {
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  return (
    <body>
      <div className='app-container'>
        <h1 className='app-header'>LiftBuddy</h1>
        {showThankYou && (
          <div className={`thank-you-message`}>Thanks for contributing!</div>
        )}

        <div className='ski-area-select'>
          <label htmlFor='skiAreaSelect'>Choose Ski Area: </label>
          <input
            autoComplete='on'
            list='skiAreaSelect'
            onChange={handleSkiAreaChange}
            value={this}
            className='input-with-datalist'
          />
          <datalist id='skiAreaSelect'>
            {!selectedSkiArea && <option value=''>Select an area</option>}
            <option value='Summit Central'>Summit Central</option>
            <option value='Summit West'>Summit West</option>
            <option value='Summit East'>Summit East</option>
            <option value='Alpental'>Alpental</option>
          </datalist>
        </div>

        {selectedSkiArea && (
          <h2 className='ski-area-header'>{selectedSkiArea} Wait Times:</h2>
        )}
        {isModalOpen && (
          <div className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
            <h3 className='modal-header'>
              How long is the line at {selectedLiftForUpdate}?
            </h3>

            {Object.keys(waitTimeMapping).map(displayedValue => (
              <button
                key={displayedValue}
                onClick={async () =>
                  await handleWaitTimeUpdate(waitTimeMapping[displayedValue])
                }
              >
                {displayedValue}
              </button>
            ))}
            <button className='cancel-button' onClick={handleCloseModal}>
              Cancel
            </button>
          </div>
        )}
        <div className='lift-list'>
          {Object.keys(liftData).map(liftName => (
            <div key={liftName} className='lift-item'>
              <p>
                {liftName}:{' '}
                <span style={getColorBasedOnWaitTime(liftData[liftName])}>
                  {liftData[liftName] === null
                    ? ' No Recent Data   '
                    : ` ${liftData[liftName]} min   `}
                </span>
                <button onClick={() => handleOpenModal(liftName)}>
                  Update
                </button>
              </p>
            </div>
          ))}
        </div>
      </div>
    </body>
  )
}

export default App

//test
