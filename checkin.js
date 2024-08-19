function checkin() {
  fetch("https://glados.rocks/api/user/checkin", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "zh,zh-TW;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6",
      "authorization": "57310465888600982880682075308228-900-1440",
      "content-type": "application/json;charset=UTF-8",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin"
    },
    "referrerPolicy": "no-referrer",
    "body": "{\"token\":\"glados.one\"}",
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then((response) => {
  
    // print the JSON response body
  
    console.log(response.json()) // {  "origin": "<YOUR_IP_ADDRESS>" }
  
  });
}

checkin();
