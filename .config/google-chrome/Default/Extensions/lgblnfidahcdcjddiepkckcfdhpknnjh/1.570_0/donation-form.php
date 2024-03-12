<?php
  $donation_period = get_field('donation_periods', 'options');
  $donation_prices = get_field('donation_prices', 'options');
  $donation_prices_monthly = get_field('donation_monthly_prices', 'options');
  $donation_prices_yearly = get_field('donation_yearly_prices', 'options');

  $monthly_subscription = get_field('monthly_subscription', 'options');
  $yearly_subscription = get_field('yearly_subscription', 'options');
  $single_payment = get_field('single_payment', 'options');

  $count = 0;
  $count_sum = 0;
  $account_paypal = get_field('paypal_account', 'options');
?>
<!-- Form Starts -->
<div class="stands-donation-form">
  <form class="donation-form" id="donate" target="_blank" action="https://www.sandbox.paypal.com/cgi-bin/webscr" method="post">
    <input type="hidden" id="input-click-action" name="cmd" value="_xclick">
    <input type="hidden" name="business" value="<?php echo $account_paypal ?>">
    <input type="hidden" name="lc" value="EN_US">
    <input type="hidden" name="currency_code" value="USD">
    <input type="hidden" name="no_shipping" value="1">
    <input type="hidden" name="no_note" value="1">
    <input type="hidden" name="custom" value="">
    <input type="hidden" name="return" value="">
    <input type="hidden" name="amount" id="single-amount" value="1.99">
    <input type="hidden" name="bn" value="stands_donation">
    <input type="hidden" name="cancel_return" value="">
    <input type="hidden" name="item_name" value="StandsApp Donation">
    <input type="hidden" name="item_number" value="">
    <input type="hidden" name="notify_url" value="https://standsapp.org/index.php?wpeppsub-listener=IPN">
    <input type="hidden" id="sum-input" name="a3" value="1.99">
    <input type="hidden" name="p3" value="1">
    <input type="hidden" id="period-input" name="t3" value="1">
    <input type="hidden" name="src" value="1">
    <input type="hidden" class="chosed-plan" name="plan" value="">
    <input type="hidden" id="stripeToken" name="stripeToken" />
    <input type="hidden" id="stripeEmail" name="stripeEmail" />
    <input type="hidden" id="isCustom" name="custom_price" value="false">
    <div class="period-choose">
      <?php foreach ($donation_period as $item) {  ?>
        <div class="period <?php if ($count === 2) { echo 'active'; }?>">
          <input type="hidden" value="<?php echo substr($item['period'], 0, 1); ?>">
          <?php if ($count === 0) { ?>
            <input type="hidden" class="monthly-plan" value="<?= $$monthly_subscription  ?>">
          <?php } ?>
          <?php if ($count === 1) { ?>
            <input type="hidden" class="yearly-plan" value="<?= $yearly_subscription ?>">
          <?php } ?>
          <?php echo $item['period'] ?>
        </div>
        <?php $count++ ?>
      <?php } ?>
    </div>
    <div class="donation-choose single shown">
      <?php foreach ($donation_prices as $item) { ?>
        <div class="donation <?php if ($count_sum === 0) {echo 'selected';} ?>">
        <input type="hidden" value="<?= $item['price'] ?>">
        <div class="left">
          <div class="price">$<?= $item['price'] ?></div>
          <div class="descr">
            <p><?= $item['text'] ?></p>
          </div>
        </div>
        <div class="right">
          <img src="<?= $item['image'] ?>" alt="">
        </div>
      </div>  
      <?php $count_sum++; } ?>
    </div>
    <div class="donation-choose monthly">
      <?php foreach ($donation_prices_monthly as $item) { ?>
        <div class="donation <?php if ($count_sum === 0) {echo 'selected';} ?>">
        <input type="hidden" value="<?= $item['monthly_price'] ?>">
        <div class="left">
          <div class="price">$<?= $item['monthly_price'] ?></div>
          <div class="descr">
            <p><?= $item['text'] ?></p>
          </div>
        </div>
        <div class="right">
          <img src="<?= $item['image'] ?>" alt="">
        </div>
      </div>  
      <?php } ?>
    </div>
    <div class="donation-choose yearly">
      <?php foreach ($donation_prices_yearly as $item) { ?>
        <div class="donation <?php if ($count_sum === 0) {echo 'selected';} ?>">
        <input type="hidden" value="<?= $item['yearly_price'] ?>">
        <div class="left">
          <div class="price">$<?= $item['yearly_price'] ?></div>
          <div class="descr">
            <p><?= $item['text'] ?></p>
          </div>
        </div>
        <div class="right">
          <img src="<?= $item['image'] ?>" alt="">
        </div>
      </div>  
      <?php } ?>
    </div>
    <div class="donation custom">
      <input type="number" id="custom-sum-input" step="0.01" class="price" placeholder="Custom amount">
      <!-- Per-seat subscription set quantity in php file -->
      </div>
    <div class="donation-pay">
      <div class="donation-pay__left">
        <div class="donation-pay-item">
          <input type="radio" id="paypal" name="contact" value="paypal" checked>
          <label for="paypal"><img src="/wp-content/uploads/paypal-1.png" alt=""></label>
        </div>
        <div class="donation-pay-item">
          <input type="radio" id="card" name="contact" value="card">
          <label for="card">Credit card</label>
        </div>
      </div>
      <div class="donation-pay__right">
        <button id="submitBtn" disabled type="submit" class="button button--brown">Pay with PayPal</button>
        <script src="https://checkout.stripe.com/checkout.js">
        </script>
      </div>
    </div>
  </form>
  <div id="payment-message" class="hidden"></div>
</div>

<div>
</div>

<div class="stripe-donation-modal">
  <div id="payment-element">
    <!--Stripe.js injects the Payment Element-->
  </div>
  <div class="spinner hidden" id="spinner"></div>
  <button disabled class="donate-btn button button--brown" type="submit" id="btnDonate">Donate</button>
</div>

<script src="https://js.stripe.com/v3/"></script>

<style>
  .donate-btn {
    justify-content: center;
    width: 100%;
    border: none;
    cursor: pointer;
  }
  .hidden {
    display: none;
  }

  #payment-message {
    color: rgb(105, 115, 134);
    font-size: 16px;
    line-height: 20px;
    padding-top: 12px;
    text-align: center;
  }

  #payment-element {
    margin-bottom: 24px;
  }
  /* spinner/processing state, errors */
  .spinner,
  .spinner:before,
  .spinner:after {
    border-radius: 50%;
  }
  .spinner {
    color: #ffffff;
    font-size: 22px;
    text-indent: -99999px;
    margin: 0px auto;
    position: relative;
    width: 20px;
    height: 20px;
    box-shadow: inset 0 0 0 2px;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
  }
  .spinner:before,
  .spinner:after {
    position: absolute;
    content: "";
  }
  .spinner:before {
    width: 10.4px;
    height: 20.4px;
    background: #5469d4;
    border-radius: 20.4px 0 0 20.4px;
    top: -0.2px;
    left: -0.2px;
    -webkit-transform-origin: 10.4px 10.2px;
    transform-origin: 10.4px 10.2px;
    -webkit-animation: loading 2s infinite ease 1.5s;
    animation: loading 2s infinite ease 1.5s;
  }
  .spinner:after {
    width: 10.4px;
    height: 10.2px;
    background: #5469d4;
    border-radius: 0 10.2px 10.2px 0;
    top: -0.1px;
    left: 10.2px;
    -webkit-transform-origin: 0px 10.2px;
    transform-origin: 0px 10.2px;
    -webkit-animation: loading 2s infinite ease;
    animation: loading 2s infinite ease;
  }

  @-webkit-keyframes loading {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes loading {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
</style>

<script>
  let paypalSettingsObj = {
    period: 0,
    sum: 1.99,
    clickAction: '_xclick-subscriptions',
  }
  let stripeSettingsObj = {
    sum: 1.99,
    type: "single"
  }
  let paymentSystem = 'paypal'
  function setPaypalPeriod(val) {
    return document.getElementById('period-input').value = val === 'O' ? 1 : val
  }
  function setPaypalSum(val) {
    document.getElementById('single-amount').value = val
    document.getElementById('sum-input').value = val

  }
  function setPaypalAction(val) {
    return document.getElementById('input-click-action').value = val
  }
  function changePaymentSystem(system) {
    paymentSystem = system
    if (stripeSettingsObj.type === 'subscription') {
      return document.getElementById('donate').action = '/wp-content/themes/stands/inc/create-subscription.php'
    }
    return system === 'stripe' ? document.getElementById('donate').action = '/wp-content/themes/stands/inc/create-checkout-session.php' : document.getElementById('donate').action = 'https://www.sandbox.paypal.com/cgi-bin/webscr'
  }
  const period = document.querySelectorAll('.period');
  const donation = document.querySelectorAll('.donation');
  const radio = document.querySelectorAll('.donation-pay-item input');
  const submitButton = document.getElementById('submitBtn');
  if (period) {
    period.forEach(item => item.addEventListener('click', function() {
      period.forEach(item => item.classList.remove('active'))
      this.classList.add('active')
      paypalSettingsObj.period = this.querySelector('input').value
      setPaypalPeriod(paypalSettingsObj.period)
      if (paypalSettingsObj.period === 'O') {
        paypalSettingsObj.clickAction = '_xclick'
        setPaypalAction(paypalSettingsObj.clickAction)
        if (paymentSystem === 'paypal') {
          document.getElementById('donate').action = 'https://www.sandbox.paypal.com/cgi-bin/webscr'
        }
      } else {
        paypalSettingsObj.clickAction = '_xclick-subscriptions'
        setPaypalAction(paypalSettingsObj.clickAction)
      }
      if (this.querySelector('input').value === 'Y') {
        stripeSettingsObj.period = "subscription"
        Array.from(document.querySelectorAll('.donation-choose')).forEach(function(el) { 
          el.classList.remove('shown');
        });
        if (paymentSystem === 'stripe') {
          document.getElementById('donate').action = '/wp-content/themes/stands/inc/create-subscription.php'
          stripeSettingsObj.type = 'subscription'
        }
        document.querySelector('.yearly').classList.add('shown');
        jQuery('.chosed-plan').val(jQuery('.yearly-plan').val())
      }
      if (this.querySelector('input').value === 'M') {
        stripeSettingsObj.period = "subscription"
        Array.from(document.querySelectorAll('.donation-choose')).forEach(function(el) { 
          el.classList.remove('shown');
        });
        document.querySelector('.monthly').classList.add('shown');
        if (paymentSystem === 'stripe') {
          stripeSettingsObj.type = 'subscription'
          document.getElementById('donate').action = '/wp-content/themes/stands/inc/create-subscription.php'
        }
        jQuery('.chosed-plan').val(jQuery('.monthly-plan').val())
      }
      if (this.querySelector('input').value === 'O') {
        stripeSettingsObj.period = "single"
        Array.from(document.querySelectorAll('.donation-choose')).forEach(function(el) { 
          el.classList.remove('shown');
        });
        document.querySelector('#submitBtn').classList.remove('subscription');
        stripeSettingsObj.type = 'single'
        document.querySelector('.single').classList.add('shown');
        if (paymentSystem === 'stripe') {
          document.getElementById('donate').action = '/wp-content/themes/stands/inc/create-checkout-session.php'
        }
      }
    }));
  }
  if (donation) {
    donation.forEach(item => item.addEventListener('click', function() {
      donation.forEach(item => item.classList.remove('selected'))
      this.classList.add('selected')
      paypalSettingsObj.sum = this.querySelector('input').value
      stripeSettingsObj.sum = this.querySelector('input').value
      jQuery('#isCustom').val(false)
      setPaypalSum(paypalSettingsObj.sum)
      if (this.querySelector('.planCustom')) {
        jQuery('.chosed-plan').val(this.querySelector('.planCustom').value)
      }
      if (this.querySelector('#custom-sum-input')) {
        jQuery('#isCustom').val(true)
      }
    }));
    document.getElementById('custom-sum-input').addEventListener('input', function() {
      setPaypalSum(this.value)
      stripeSettingsObj.sum = this.value
    });
  }

  if(radio) {
    radio.forEach(item => item.addEventListener('change', function() {
      let str = 'Pay with PayPal'
      if (this.value === 'paypal') {
        stripeSettingsObj.type = 'single'
        document.querySelector('#submitBtn').classList.remove('subscription');
        changePaymentSystem('paypal')
        document.getElementById('donate').classList.remove('stripe-form');
        let strWidth = str.length * 11.3
        jQuery(submitButton).css({"width": strWidth}).text(str);
        document.querySelector('#submitBtn').classList.remove('stripe-checkout');
      } else {
        if (stripeSettingsObj.period === 'subscription') {
          document.getElementById('donate').action = '/wp-content/themes/stands/inc/create-subscription.php'
          stripeSettingsObj.type = 'subscription'
        }
        str = 'Pay with Credit card'
        let strWidth = str.length * 10
        jQuery(submitButton).css({"width": strWidth})
        changePaymentSystem('stripe')
        document.getElementById('donate').classList.add('stripe-form');
        setTimeout(() => {
          jQuery(submitButton).text(str);
        }, 250);
        document.querySelector('#submitBtn').classList.add('stripe-checkout');
      }
    }))
  }
    document.getElementById('submitBtn').addEventListener('click', function(event) {
      if (document.getElementById('donate').classList.contains('stripe-form') && document.getElementById('submitBtn').classList.contains('stripe-checkout')) {
        runStripe(event)
      }
    })
  
  var handler = StripeCheckout.configure({
    key: 'pk_test_51LbTf2LKqGTYnMigAWqBBjPk30zClUyGiffhWkXrlnQgjz4qW02rkG5jjlYOd45wdy2zn9mRWHDJBjEqYNFYb3Yy00AZjtIDv4',
    token: function(token) {
      jQuery("#stripeToken").val(token.id);
      jQuery("#stripeEmail").val(token.email);
      jQuery("#donate").submit();
    }
  });

  function runStripe(e) {
//       console.log('stirpe');
      var amountInCents = Math.floor(stripeSettingsObj.sum * 100);
      var displayAmount = parseFloat(Math.floor(stripeSettingsObj.sum * 100) / 100).toFixed(2);
      // Open Checkout with further options
      handler.open({
        name: 'Stands Donation',
        description: 'Stands Donation Subscription',
        amount: amountInCents,
      });
      e.preventDefault();
  }

  // Close Checkout on page navigation
  jQuery(window).on('popstate', function() {
    handler.close();
  });

</script>
