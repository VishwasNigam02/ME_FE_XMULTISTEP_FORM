  (() => {
    const form = document.getElementById('multistep-form');
    const steps = [...document.querySelectorAll('.form-step')];
    const nextButton = document.getElementById('next-button');
    const backButton = document.getElementById('back-button');
    const planCards = [...document.querySelectorAll('.plan-card')];
    const addonInputs = [...document.querySelectorAll('.addon-checkbox')];
    const billingToggle = document.getElementById('billing-toggle');
    const monthlyLabel = document.getElementById('monthly-label');
    const yearlyLabel = document.getElementById('yearly-label');

    const plans = {
      Arcade: { monthly: 9, yearly: 90 },
      Advance: { monthly: 12, yearly: 120 },
      Pro: { monthly: 15, yearly: 150 }
    };
    const state = {
      step: 1,
      yearly: false,
      plan: null,
      confirmed: false
    };

    const money = value => `$${value}`;
    const suffix = () => state.yearly ? '/yr' : '/mo';
    const priceForPlan = name => state.yearly ? plans[name].yearly : plans[name].monthly;
    const addonPrice = input => Number(state.yearly ? input.dataset.yearly : input.dataset.monthly);

    function showStep(step) {
      state.step = step;
      steps.forEach(section => section.classList.toggle('active', Number(section.dataset.step) === step));
      document.querySelectorAll('[data-step-indicator]').forEach(item => item.classList.toggle('active', Number(item.dataset.stepIndicator) === Math.min(step, 4)));
      document.querySelectorAll('[data-mobile-step]').forEach(item => item.classList.toggle('active', Number(item.dataset.mobileStep) === Math.min(step, 4)));
      backButton.hidden = step === 1 || step === 5;
      nextButton.hidden = step === 5;
      nextButton.textContent = step === 4 ? 'Confirm' : 'Next step';
      if (step === 4) renderSummary();
      document.querySelectorAll('.step-error').forEach(error => error.classList.remove('visible'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validatePersonalInfo() {
      const fields = [
        { id: 'userName', error: 'name-error', valid: value => value.trim().length > 0 },
        { id: 'email', error: 'email-error', valid: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) },
        { id: 'phone', error: 'phone-error', valid: value => value.trim().length > 0 && /^[+()\d\s.-]{7,}$/.test(value.trim()) }
      ];
      let valid = true;
      fields.forEach(field => {
        const input = document.getElementById(field.id);
        const group = input.closest('.field-group');
        const error = document.getElementById(field.error);
        const value = input.value;
        const isValid = field.valid(value);
        group.classList.toggle('invalid', !isValid);
        if (!isValid) {
          valid = false;
          if (field.id === 'email') error.textContent = value.trim() ? 'Enter a valid email' : 'This field is required';
        }
      });
      return valid;
    }

    function renderBilling() {
      document.body.classList.toggle('yearly', state.yearly);
      billingToggle.setAttribute('aria-checked', String(state.yearly));
      monthlyLabel.classList.toggle('selected', !state.yearly);
      yearlyLabel.classList.toggle('selected', state.yearly);
      planCards.forEach(card => {
        const name = card.dataset.plan;
        card.querySelector('.plan-price').textContent = `${money(priceForPlan(name))}${suffix()}`;
      });
      document.querySelectorAll('.addon-price').forEach((element, index) => {
        const input = addonInputs[index];
        element.textContent = `+${money(addonPrice(input))}${suffix()}`;
      });
      if (state.step === 4) renderSummary();
    }

    function renderSummary() {
      if (!state.plan) return;
      document.getElementById('summary-plan-name').textContent = `${state.plan} (${state.yearly ? 'Yearly' : 'Monthly'})`;
      document.getElementById('summary-plan-price').textContent = `${money(priceForPlan(state.plan))}${suffix()}`;
      const addonContainer = document.getElementById('summary-addons');
      addonContainer.replaceChildren();
      const selectedAddons = addonInputs.filter(input => input.checked);
      selectedAddons.forEach(input => {
        const row = document.createElement('div');
        row.className = 'summary-addon';
        const name = document.createElement('span');
        name.textContent = input.value;
        const price = document.createElement('span');
        price.textContent = `+${money(addonPrice(input))}${suffix()}`;
        row.append(name, price);
        addonContainer.append(row);
      });
      const total = priceForPlan(state.plan) + selectedAddons.reduce((sum, input) => sum + addonPrice(input), 0);
      document.getElementById('total-label').textContent = `Total (per ${state.yearly ? 'year' : 'month'})`;
      document.getElementById('summary-total').textContent = `${money(total)}${suffix()}`;
    }

    planCards.forEach(card => {
      card.addEventListener('click', () => {
        state.plan = card.dataset.plan;
        planCards.forEach(item => {
          const selected = item === card;
          item.classList.toggle('selected', selected);
          item.setAttribute('aria-pressed', String(selected));
        });
        document.getElementById('plan-error').classList.remove('visible');
      });
    });

    billingToggle.addEventListener('click', () => {
      state.yearly = !state.yearly;
      renderBilling();
    });
    monthlyLabel.addEventListener('click', () => {
      state.yearly = false;
      renderBilling();
    });
    yearlyLabel.addEventListener('click', () => {
      state.yearly = true;
      renderBilling();
    });

    addonInputs.forEach(input => input.addEventListener('change', () => {
      if (state.step === 4) renderSummary();
    }));

    backButton.addEventListener('click', () => {
      if (state.step > 1 && state.step <= 4) showStep(state.step - 1);
    });

    nextButton.addEventListener('click', () => {
      if (state.step === 1) {
        if (validatePersonalInfo()) showStep(2);
        return;
      }
      if (state.step === 2) {
        if (!state.plan) {
          document.getElementById('plan-error').classList.add('visible');
          return;
        }
        showStep(3);
        return;
      }
      if (state.step === 3) {
        showStep(4);
        return;
      }
      if (state.step === 4) {
        state.confirmed = true;
        showStep(5);
      }
    });

    document.getElementById('change-plan').addEventListener('click', () => showStep(2));

    // Clear required-field errors as the user corrects their input.
    ['userName', 'email', 'phone'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        const input = document.getElementById(id);
        if (!input.closest('.field-group').classList.contains('invalid')) return;
        const valid = id === 'userName' ? input.value.trim().length > 0
          : id === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
          : input.value.trim().length > 0 && /^[+()\d\s.-]{7,}$/.test(input.value.trim());
        if (valid) input.closest('.field-group').classList.remove('invalid');
      });
    });

    form.addEventListener('submit', event => event.preventDefault());
    renderBilling();
    showStep(1);
  })();
