const vanityEl = document.getElementById("vanity-list");

function vanity(bold, solana, bg = "bg-secondary/20") {
  return `
  <div class="p-2 pb-0 ${bg} border border-secondary rounded-lg mb-2">
  <li class="overflow-scroll text-secondary-content roboto-mono-font"><span class="font-bold">${bold}</span>${solana}</li>
  <div class="flex justify-end p-1 underline">
  <a target="_blank" href="https://explorer.solana.com/address/${bold+solana}">
  <li class="badge badge-secondary bg-secondary/50 mb-1 text-md">
  See Explorer<i class="ri-arrow-right-up-line"></i>
  </a>
  </div>
  </div>`
}


vanityEl.insertAdjacentHTML("beforeend", vanity("123","wRuF4UCateB4BcJhPryHKLHcEPE792aD65WWyZUUH"))