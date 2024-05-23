import React, { useState, useEffect } from 'react'

import Select from 'react-dropdown-select'
import axios from 'axios'
import './App.css'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const LIFTDATA = require('./lift-data.json')
const LIFTS = LIFTDATA.liftData
const BACKEND_URL =
  process.env.BACKEND_URL ?? 'https://backend-ct0m1hra2j7pg.cpln.app'
// Initialize an agent at application startup.
const fpPromise = FingerprintJS.load()
const onChange = values => {
  return <div>debug: {values}</div>
}

const App = () => {
  const [selectedSkiArea, setSelectedSkiArea] = useState([])
  const [skiAreas, setSkiAreas] = useState([])
  const [liftData, setLiftData] = useState({})
  const [waitTimeData, setWaitTimeData] = useState({})
  const [uniqueID, setUniqueID] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLiftForUpdate, setSelectedLiftForUpdate] = useState(null)

  const [showThankYou, setShowThankYou] = useState(false)

  const [fadeOut, setFadeOut] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const skiAreaSelect = ({ options }) => (
    <Select
      multi
      closeOnSelect
      placeholder='Choose one or more ski areas...'
      options={options}
      values={[]}
      onChange={values => {
        if (Array.isArray(values) && values.length) {
          handleSkiAreaChange(values)
        }
      }}
    />
  )

  const displayWaitTimes = skiArea => {
    console.log({ lift: skiArea.lifts })

    return (
      <div>
        <h2 className='ski-area-header'>{skiArea.area} Wait Times:</h2>
        <div className='lift-list'>
          {Object.keys(skiArea.lifts).map(lift => (
            <div key={lift} className='lift-item'>
              <p>
                {lift}:{' '}
                <span style={getColorBasedOnWaitTime(skiArea.lifts[lift])}>
                  {skiArea.lifts[lift] === null
                    ? ' No Data   '
                    : ` ${skiArea.lifts[lift]} min   `}
                </span>
                <button onClick={() => handleOpenModal(lift)}>Update</button>
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  useEffect(() => {
    // Generate a uniqueID for the user (You may want to implement this differently)

    // Fetch ski areas from your JSON data
    fetchSkiAreas()

    // Fetch initial lift data when the component mounts
    //fetchLiftData(selectedSkiArea)

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

    const options = skiAreaNames.map(skiArea => ({
      label: skiArea,
      value: skiArea
    }))

    const result = { options: options }

    setSkiAreas(result)
  }

  const fetchLiftData = async skiAreas => {
    //console.log(JSON.stringify(skiAreas))
    if (skiAreas.length === 0) {
      return
    }
    let data = { areas: [] }
    for (const skiArea of skiAreas) {
      await axios
        .get(`${BACKEND_URL}/status/${skiArea.value}`)

        .then(response => {
          data['areas'].push({ area: skiArea.value, lifts: response.data })
        })
        .catch(error => {
          console.error('Error fetching lift data', error)
        })
    }
    setLiftData(data)

    console.log(JSON.stringify(liftData))
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
    '20+ minutes': 20
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

  function handleSkiAreaChange (selectedAreas) {
    if (selectedAreas != null) {
      setSelectedSkiArea(selectedAreas)
      fetchLiftData(selectedAreas)
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
    handleCloseModal()
    axios
      .post(`${BACKEND_URL}/update`, {
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
      .finally(() => {})
  }

  return (
    <body>
      {/* <MetaTags>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
        />
      </MetaTags> */}
      <div className='app-container'>
        <h1 className='app-header'>LiftBuddy</h1>
        {showThankYou && (
          <div className={`thank-you-message`}>Thanks for contributing!</div>
        )}

        <div className='dropdown'>{skiAreaSelect(skiAreas)}</div>

        {(liftData.areas ?? []).map(area => displayWaitTimes(area))}

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
      </div>
    </body>
  )
}

export default App
