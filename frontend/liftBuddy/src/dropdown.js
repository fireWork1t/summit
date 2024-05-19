alert('sadfsfds')

document.addEventListener('DOMContentLoaded', event => {
  const dropdownSearch = document.getElementById('dropdownSearch')
  const dropdownItems = document.getElementById('dropdownItems')

  // Show the dropdown items when the search input is clicked
  dropdownSearch.addEventListener('click', () => {
    dropdownItems.style.display = 'block'
  })

  // Filter the dropdown items based on the search input
  dropdownSearch.addEventListener('keyup', () => {
    let filter = dropdownSearch.value.toUpperCase()
    let items = dropdownItems.getElementsByClassName('dropdown-item')

    for (let i = 0; i < items.length; i++) {
      let item = items[i]
      let txtValue = item.textContent || item.innerText

      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        item.style.display = ''
      } else {
        item.style.display = 'none'
      }
    }
  })

  // Close the dropdown if the user clicks outside of it
  document.addEventListener('click', event => {
    if (!event.target.matches('#dropdownSearch')) {
      dropdownItems.style.display = 'none'
    }
  })
})
