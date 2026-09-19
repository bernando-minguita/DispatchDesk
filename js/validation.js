function clearFieldErrors(container) {
    if (!container) container = document;
    container.querySelectorAll('.field-error').forEach(el => el.remove());
    container.querySelectorAll('.row-error').forEach(el => el.classList.remove('row-error'));
    container.querySelectorAll('input, select').forEach(el => {
        el.style.borderColor = '';
    });
}

function showFieldError(inputEl, message) {
    if (!inputEl) return;
    const wrapper = inputEl.parentElement;
    if (!wrapper) return;
    const existing = wrapper.querySelector('.field-error');
    if (existing) existing.remove();
    const errorEl = document.createElement('p');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    wrapper.appendChild(errorEl);
    inputEl.style.borderColor = '#B85450';
}

function attachClearErrorListener(inputEl) {
    if (!inputEl || inputEl._clearErrorAttached) return;
    inputEl._clearErrorAttached = true;
    const clear = () => {
        const wrapper = inputEl.parentElement;
        if (!wrapper) return;
        const existing = wrapper.querySelector('.field-error');
        if (existing) existing.remove();
        inputEl.style.borderColor = '';
    };
    inputEl.addEventListener('input', clear);
    inputEl.addEventListener('change', clear);
    inputEl.addEventListener('blur', clear);
}

function isAddressBookEntryValid(name, type, number) {
    const trimmedNumber = String(number || '').trim();
    if (!trimmedNumber) return false;
    const result = window.execQuery('SELECT * FROM address_book WHERE type = ? AND id = ?', [type, trimmedNumber]);
    if (result.length === 0) return false;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) return false;
    return result.some(r => String(r.name).trim() === trimmedName);
}

function isFleetEntryValid(unitId) {
    const trimmedId = String(unitId || '').trim();
    if (!trimmedId) return true;
    const result = window.execQuery('SELECT * FROM fleet WHERE id = ?', [trimmedId]);
    return result.length > 0;
}

function lookupAddressBookName(type, numberInputEl, nameInputEl) {
    const number = numberInputEl.value.trim();
    if (!number) {
        nameInputEl.value = '';
        return;
    }
    const result = window.execQuery('SELECT name FROM address_book WHERE type = ? AND id = ?', [type, number]);
    if (result.length > 0) {
        nameInputEl.value = result[0].name;
    } else {
        nameInputEl.value = '';
    }
}

function validateSingleOrder() {
    clearFieldErrors(document.getElementById('form-order'));
    const orderNumber = document.getElementById('order_number').value.trim();
    const branch = document.getElementById('branch').value;
    const status = document.getElementById('order_initial_status').value;
    const driverName = document.getElementById('driver_name').value.trim();
    const badgeNumber = document.getElementById('badge_number').value.trim();
    const customerName = document.getElementById('customer_name').value.trim();
    const customerNumber = document.getElementById('customer_number').value.trim();
    const headNumber = document.getElementById('head_number').value.trim();
    const attachmentNumber = document.getElementById('attachment_number').value.trim();
    const origin = document.getElementById('destination_from').value.trim();
    const destination = document.getElementById('destination_to').value.trim();
    const departureDate = document.getElementById('actual_departure_date').value;
    const customerEta = document.getElementById('customer_eta').value;
    const offloadingDate = document.getElementById('expected_offloading_date').value;

    let isValid = true;

    if (!orderNumber) {
        showFieldError(document.getElementById('order_number'), 'Order number is required.');
        isValid = false;
    }
    if (!branch) {
        showFieldError(document.getElementById('branch'), 'Branch is required.');
        isValid = false;
    }
    if (!status) {
        showFieldError(document.getElementById('order_initial_status'), 'Status is required.');
        isValid = false;
    }
    if (!headNumber) {
        showFieldError(document.getElementById('head_number'), 'Head number is required.');
        isValid = false;
    } else if (!isFleetEntryValid(headNumber)) {
        showFieldError(document.getElementById('head_number'), 'Head number not found in fleet.');
        isValid = false;
    }
    if (!attachmentNumber) {
        showFieldError(document.getElementById('attachment_number'), 'Attachment number is required.');
        isValid = false;
    } else if (!isFleetEntryValid(attachmentNumber)) {
        showFieldError(document.getElementById('attachment_number'), 'Attachment number not found in fleet.');
        isValid = false;
    }
    if (!origin) {
        showFieldError(document.getElementById('destination_from'), 'Origin / Pick-up Location / Shipper is required.');
        isValid = false;
    }
    if (!destination) {
        showFieldError(document.getElementById('destination_to'), 'Destination / Delivery Location / Consignee is required.');
        isValid = false;
    }
    if (!badgeNumber) {
        showFieldError(document.getElementById('badge_number'), 'Badge number is required.');
        isValid = false;
    }
    if (!isAddressBookEntryValid(driverName, 'driver', badgeNumber)) {
        showFieldError(document.getElementById('badge_number'), 'Badge number / driver name not found in address book.');
        isValid = false;
    }
    if (!customerNumber) {
        showFieldError(document.getElementById('customer_number'), 'Customer number is required.');
        isValid = false;
    }
    if (!isAddressBookEntryValid(customerName, 'customer', customerNumber)) {
        showFieldError(document.getElementById('customer_number'), 'Customer number / name not found in address book.');
        isValid = false;
    }
    if (customerEta && departureDate && customerEta < departureDate) {
        showFieldError(document.getElementById('customer_eta'), 'Customer ETA must be on or after departure date.');
        isValid = false;
    }
    if (offloadingDate && departureDate && offloadingDate < departureDate) {
        showFieldError(document.getElementById('expected_offloading_date'), 'Expected offloading date must be on or after departure date.');
        isValid = false;
    }

    return isValid;
}

function validateMultipleOrderRow(row) {
    const orderNumber = row.querySelector('.mo-order_number').value.trim();
    const branch = row.querySelector('.mo-branch').value.trim();
    const status = row.querySelector('.mo-initial_status').value.trim();
    const driverName = row.querySelector('.mo-driver_name').value.trim();
    const badgeNumber = row.querySelector('.mo-badge_number').value.trim();
    const customerName = row.querySelector('.mo-customer_name').value.trim();
    const customerNumber = row.querySelector('.mo-customer_number').value.trim();
    const headNumber = row.querySelector('.mo-head_number').value.trim();
    const attachmentNumber = row.querySelector('.mo-attachment_number').value.trim();
    const origin = row.querySelector('.mo-destination_from').value.trim();
    const destination = row.querySelector('.mo-destination_to').value.trim();
    const departureDate = row.querySelector('.mo-actual_departure_date').value;
    const customerEta = row.querySelector('.mo-customer_eta').value;
    const offloadingDate = row.querySelector('.mo-expected_offloading_date').value;

    let isValid = true;

    if (!orderNumber) {
        showFieldError(row.querySelector('.mo-order_number'), 'Order number is required.');
        isValid = false;
    }
    if (!branch) {
        showFieldError(row.querySelector('.mo-branch'), 'Branch is required.');
        isValid = false;
    }
    if (!status) {
        showFieldError(row.querySelector('.mo-initial_status'), 'Status is required.');
        isValid = false;
    }
    if (!headNumber) {
        showFieldError(row.querySelector('.mo-head_number'), 'Head number is required.');
        isValid = false;
    } else if (!isFleetEntryValid(headNumber)) {
        showFieldError(row.querySelector('.mo-head_number'), 'Head number not found in fleet.');
        isValid = false;
    }
    if (!attachmentNumber) {
        showFieldError(row.querySelector('.mo-attachment_number'), 'Attachment number is required.');
        isValid = false;
    } else if (!isFleetEntryValid(attachmentNumber)) {
        showFieldError(row.querySelector('.mo-attachment_number'), 'Attachment number not found in fleet.');
        isValid = false;
    }
    if (!origin) {
        showFieldError(row.querySelector('.mo-destination_from'), 'Origin / Pick-up Location / Shipper is required.');
        isValid = false;
    }
    if (!destination) {
        showFieldError(row.querySelector('.mo-destination_to'), 'Destination / Delivery Location / Consignee is required.');
        isValid = false;
    }
    if (!badgeNumber) {
        showFieldError(row.querySelector('.mo-badge_number'), 'Badge number is required.');
        isValid = false;
    }
    if (!isAddressBookEntryValid(driverName, 'driver', badgeNumber)) {
        showFieldError(row.querySelector('.mo-badge_number'), 'Badge number / driver name not found in address book.');
        isValid = false;
    }
    if (!customerNumber) {
        showFieldError(row.querySelector('.mo-customer_number'), 'Customer number is required.');
        isValid = false;
    }
    if (!isAddressBookEntryValid(customerName, 'customer', customerNumber)) {
        showFieldError(row.querySelector('.mo-customer_number'), 'Customer number / name not found in address book.');
        isValid = false;
    }
    if (customerEta && departureDate && customerEta < departureDate) {
        showFieldError(row.querySelector('.mo-customer_eta'), 'Customer ETA must be on or after departure date.');
        isValid = false;
    }
    if (offloadingDate && departureDate && offloadingDate < departureDate) {
        showFieldError(row.querySelector('.mo-expected_offloading_date'), 'Expected offloading date must be on or after departure date.');
        isValid = false;
    }

    if (!isValid) {
        row.classList.add('row-error');
    } else {
        row.classList.remove('row-error');
    }

    return isValid;
}

window.clearFieldErrors = clearFieldErrors;
window.showFieldError = showFieldError;
window.attachClearErrorListener = attachClearErrorListener;
window.isAddressBookEntryValid = isAddressBookEntryValid;
window.isFleetEntryValid = isFleetEntryValid;
window.lookupAddressBookName = lookupAddressBookName;
window.validateSingleOrder = validateSingleOrder;
window.validateMultipleOrderRow = validateMultipleOrderRow;
