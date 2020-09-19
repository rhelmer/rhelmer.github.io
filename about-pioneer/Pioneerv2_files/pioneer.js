/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Remote Settings keys for general content, and available studies.
 */
const STUDY_ADDON_COLLECTION_KEY = "pioneer-study-addons-v1";

const STUDY_LEAVE_REASONS = {
  USER_ABANDONED: "user-abandoned",
  STUDY_ENDED: "study-ended",
};

const WEB_CHANNEL_ID = "pioneer";

function showEnrollmentStatus() {
  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: WEB_CHANNEL_ID,
        message: {
          enrolled: true,
        },
      }),
    })
  );
}

async function toggleEnrolled(studyAddonId, cachedAddons) {
  /*
  const completedStudies = Services.prefs.getStringPref(
    PREF_PIONEER_COMPLETED_STUDIES,
    "{}"
  );
*/
  console.debug(studyAddonId, cachedAddons);

  const cachedAddon = cachedAddons.find((a) => a.addon_id == studyAddonId);
  const addon = null;

  const study = document.querySelector(`.card[id="${cachedAddon.addon_id}"`);
  const joinBtn = study.querySelector(".join-button");

  if (addon) {
    joinBtn.disabled = true;
    window.dispatchEvent(
      new window.CustomEvent("WebChannelMessageToChrome", {
        detail: JSON.stringify({
          id: WEB_CHANNEL_ID,
          message: {
            uninstallStudy: studyAddonId,
          },
        }),
      })
    );

    // document.l10n.setAttributes(joinBtn, "pioneer-join-study");
    joinBtn.disabled = false;
    /*
    // Record that the user abandoned this study, since it may not be re-join-able.
    if (completedStudies) {
      const studies = JSON.parse(completedStudies);
      studies[studyAddonId] = STUDY_LEAVE_REASONS.USER_ABANDONED;
      Services.prefs.setStringPref(
        PREF_PIONEER_COMPLETED_STUDIES,
        JSON.stringify(studies)
      );
    }
    */
  } else {
    /*
    // Check if this study is re-join-able before enrollment.
    const studies = JSON.parse(completedStudies);
    if (studyAddonId in studies) {
      if (
        "canRejoin" in cachedAddons[studyAddonId] &&
        cachedAddons[studyAddonId].canRejoin === false
      ) {
        console.error(
          `Cannot rejoin ended study ${studyAddonId}, reason: ${studies[studyAddonId]}`
        );
        return;
      }
    }
    */
    joinBtn.disabled = true;
    window.dispatchEvent(
      new window.CustomEvent("WebChannelMessageToChrome", {
        detail: JSON.stringify({
          id: WEB_CHANNEL_ID,
          message: {
            installStudy: studyAddonId,
          },
        }),
      })
    );

    // await install.install();
    // document.l10n.setAttributes(joinBtn, "pioneer-leave-study");
    joinBtn.disabled = false;
  }

  await updateStudy(cachedAddon.addon_id);
}

async function showAvailableStudies(cachedAddons) {
  // const pioneerId = Services.prefs.getStringPref(PREF_PIONEER_ID, null);
  const pioneerId = "abc123";
  const defaultAddons = cachedAddons.filter((a) => a.isDefault);
  /*
  if (pioneerId) {
    for (const defaultAddon of defaultAddons) {
      let addon;
      let install;
      addon = await AddonManager.getAddonByID(defaultAddon.addon_id);
      install = await AddonManager.getInstallForURL(
        defaultAddon.sourceURI.spec
      );

      if (!addon) {
        // Any default add-ons are required, try to reinstall.
        await install.install();
      }
    }
  }
  */

  const studyAddons = cachedAddons.filter((a) => !a.isDefault);
  for (const cachedAddon of studyAddons) {
    if (!cachedAddon) {
      console.error(
        `about:pioneer - Study addon ID not found in cache: ${studyAddonId}`
      );
      return;
    }

    const studyAddonId = cachedAddon.addon_id;

    const study = document.createElement("div");
    study.setAttribute("id", studyAddonId);
    study.setAttribute("class", "card card-no-hover");

    if (cachedAddon.icons && 32 in cachedAddon.icons) {
      const iconName = document.createElement("img");
      iconName.setAttribute("class", "card-icon");
      iconName.setAttribute("src", cachedAddon.icons[32]);
      study.appendChild(iconName);
    }

    const studyBody = document.createElement("div");
    studyBody.classList.add("card-body");
    study.appendChild(studyBody);

    const studyName = document.createElement("h3");
    studyName.setAttribute("class", "card-name");
    studyName.textContent = cachedAddon.name;
    studyBody.appendChild(studyName);

    const studyAuthor = document.createElement("span");
    studyAuthor.setAttribute("class", "card-author");
    studyAuthor.textContent = cachedAddon.authors.name;
    studyBody.appendChild(studyAuthor);

    const actions = document.createElement("div");
    actions.classList.add("card-actions");
    study.appendChild(actions);

    const joinBtn = document.createElement("button");
    joinBtn.setAttribute("id", `${studyAddonId}-join-button`);
    joinBtn.classList.add("primary");
    joinBtn.classList.add("join-button");
    // document.l10n.setAttributes(joinBtn, "pioneer-join-study");

    joinBtn.addEventListener("click", async () => {
      //      let addon;
      //      addon = await AddonManager.getAddonByID(studyAddonId);
      const addon = false;

      let joinOrLeave = addon ? "leave" : "join";
      let dialog = document.getElementById(
        `${joinOrLeave}-study-consent-dialog`
      );
      dialog.setAttribute("addon-id", cachedAddon.addon_id);
      const consentText = dialog.querySelector(
        `[id=${joinOrLeave}-study-consent]`
      );

      // Clears out any existing children with a single #text node.
      consentText.textContent = "";
      for (const line of cachedAddon[`${joinOrLeave}StudyConsent`].split(
        "\n"
      )) {
        const li = document.createElement("li");
        li.textContent = line;
        consentText.appendChild(li);
      }

      dialog.showModal();
      dialog.scrollTop = 0;

      const openEvent = new Event("open");
      dialog.dispatchEvent(openEvent);
    });
    actions.appendChild(joinBtn);

    const studyDesc = document.createElement("div");
    studyDesc.setAttribute("class", "card-description");
    study.appendChild(studyDesc);

    const shortDesc = document.createElement("p");
    shortDesc.textContent = cachedAddon.description;
    studyDesc.appendChild(shortDesc);

    const privacyPolicyLink = document.createElement("a");
    privacyPolicyLink.href = cachedAddon.privacyPolicy.spec;
    privacyPolicyLink.textContent = "privacy policy";

    const privacyPolicy = document.createElement("p");
    const privacyPolicyStart = document.createElement("span");
    privacyPolicyStart.textContent = "You can always find the ";
    privacyPolicy.append(privacyPolicyStart);
    privacyPolicy.append(privacyPolicyLink);
    const privacyPolicyEnd = document.createElement("span");
    privacyPolicyEnd.textContent = " at our website.";
    privacyPolicy.append(privacyPolicyEnd);
    studyDesc.appendChild(privacyPolicy);

    const studyDataCollected = document.createElement("div");
    studyDataCollected.setAttribute("class", "card-data-collected");
    study.appendChild(studyDataCollected);

    const dataCollectionDetailsHeader = document.createElement("p");
    dataCollectionDetailsHeader.textContent = "This study will collect:";
    studyDataCollected.appendChild(dataCollectionDetailsHeader);

    const dataCollectionDetails = document.createElement("ul");
    for (const dataCollectionDetail of cachedAddon.dataCollectionDetails) {
      const detailsBullet = document.createElement("li");
      detailsBullet.textContent = dataCollectionDetail;
      dataCollectionDetails.append(detailsBullet);
    }
    studyDataCollected.appendChild(dataCollectionDetails);

    const availableStudies = document.getElementById("available-studies");
    availableStudies.appendChild(study);

    await updateStudy(studyAddonId);
  }

  const availableStudies = document.getElementById("header-available-studies");
  // document.l10n.setAttributes(availableStudies, "pioneer-current-studies");
}

async function updateStudy(studyAddonId) {
  const study = document.querySelector(`.card[id="${studyAddonId}"`);

  const joinBtn = study.querySelector(".join-button");

  // const pioneerId = Services.prefs.getStringPref(PREF_PIONEER_ID, null);
  const pioneerId = "abc123";

  /*
  const completedStudies = Services.prefs.getStringPref(
    PREF_PIONEER_COMPLETED_STUDIES,
    "{}"
  );

  const studies = JSON.parse(completedStudies);
  if (studyAddonId in studies) {
    study.style.opacity = 0.5;
    joinBtn.disabled = true;
    // document.l10n.setAttributes(joinBtn, "pioneer-ended-study");
    return;
  }
*/

  if (pioneerId) {
    study.style.opacity = 1;
    joinBtn.disabled = false;
    /*
    if (addon) {
      // document.l10n.setAttributes(joinBtn, "pioneer-leave-study");
    } else {
      // document.l10n.setAttributes(joinBtn, "pioneer-join-study");
    }
    */
  } else {
    // document.l10n.setAttributes(joinBtn, "pioneer-study-prompt");
    study.style.opacity = 0.5;
    joinBtn.disabled = true;
  }
}

async function setup(cachedAddons) {
  window.addEventListener("WebChannelMessageToContent", function (e) {
    // receive messages
    console.log(e.detail);
    let enrolled = false;
    const enrollmentButton = document.getElementById("enrollment-button");
    if ("enrolled" in e.detail.message.data) {
      if (e.detail.message.data.enrolled == true) {
        enrolled = true;
      }
      /*
      if (enrolled) {
        let dialog = document.getElementById("leave-pioneer-consent-dialog");
        dialog.showModal();
        dialog.scrollTop = 0;
      } else {
        let dialog = document.getElementById("join-pioneer-consent-dialog");
        dialog.showModal();
        dialog.scrollTop = 0;
      }
*/
      //document.l10n.setAttributes(
      //  enrollmentButton,
      //  `pioneer-${pioneerId ? "un" : ""}enrollment-button`
      //);
    } else if ("unenroll" in e.detail.message.data) {
      if (e.detail.message.data.unenrolled == true) {
        enrolled = false;
      }
    }
    if (enrolled) {
      enrollmentButton.textContent = "Leave Pioneer";
      enrollmentButton.classList.toggle("primary", !enrolled);
    } else {
      enrollmentButton.textContent = "Join Pioneer";
      enrollmentButton.classList.toggle("primary", true);
    }
  });

  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: WEB_CHANNEL_ID,
        message: {
          enrolled: true,
        },
      }),
    })
  );

  document
    .getElementById("enrollment-button")
    .addEventListener("click", async (e) => {
      let message = { enroll: true };
      console.debug("1");
      if (e.target.textContent == "Leave Pioneer") {
        console.debug("2");
        message = { unenroll: true };
      }

      window.dispatchEvent(
        new window.CustomEvent("WebChannelMessageToChrome", {
          detail: JSON.stringify({
            id: WEB_CHANNEL_ID,
            message,
          }),
        })
      );
    });

  document
    .getElementById("join-pioneer-cancel-dialog-button")
    .addEventListener("click", () =>
      document.getElementById("join-pioneer-consent-dialog").close()
    );
  document
    .getElementById("leave-pioneer-cancel-dialog-button")
    .addEventListener("click", () =>
      document.getElementById("leave-pioneer-consent-dialog").close()
    );
  document
    .getElementById("join-study-cancel-dialog-button")
    .addEventListener("click", () =>
      document.getElementById("join-study-consent-dialog").close()
    );
  document
    .getElementById("leave-study-cancel-dialog-button")
    .addEventListener("click", () =>
      document.getElementById("leave-study-consent-dialog").close()
    );

  document
    .getElementById("join-pioneer-accept-dialog-button")
    .addEventListener("click", async (event) => {
      //const pioneerId = Services.prefs.getStringPref(PREF_PIONEER_ID, null);
      const pioneerId = "abc123";

      window.dispatchEvent(
        new window.CustomEvent("WebChannelMessageToChrome", {
          detail: JSON.stringify({
            id: WEB_CHANNEL_ID,
            message: {
              enroll: true,
            },
          }),
        })
      );

      //document.l10n.setAttributes(
      //  availableStudies,
      //  "pioneer-no-current-studies"
      //);

      //const study = document.getElementById(cachedAddon.addon_id);
      //if (study) {
      //  await updateStudy(cachedAddon.addon_id);
      //}

      document.querySelector("dialog").close();

      showEnrollmentStatus();
    });

  document
    .getElementById("leave-pioneer-accept-dialog-button")
    .addEventListener("click", async (event) => {
      window.dispatchEvent(
        new window.CustomEvent("WebChannelMessageToChrome", {
          detail: JSON.stringify({
            id: WEB_CHANNEL_ID,
            message: {
              unenroll: true,
            },
          }),
        })
      );
      //      const completedStudies = Services.prefs.getStringPref(
      //        PREF_PIONEER_COMPLETED_STUDIES,
      //        "{}"
      //      );
      const completedStudies = {};
      const studies = JSON.parse(completedStudies);

      // Send a deletion ping for all completed studies the user has been a part of.
      for (const studyAddonId in studies) {
        await sendDeletionPing(studyAddonId);
      }

      Services.prefs.clearUserPref(PREF_PIONEER_COMPLETED_STUDIES);

      for (const cachedAddon of cachedAddons) {
        // Record any studies that have been marked as concluded on the server, in case they re-enroll.
        if ("studyEnded" in cachedAddon && cachedAddon.studyEnded === true) {
          studies[cachedAddon.addon_id] = STUDY_LEAVE_REASONS.STUDY_ENDED;

          Services.prefs.setStringPref(
            PREF_PIONEER_COMPLETED_STUDIES,
            JSON.stringify(studies)
          );
        }

        let addon;
        if (Cu.isInAutomation) {
          addon = {};
          addon.id = cachedAddon.addon_id;
          addon.uninstall = () => {
            let testAddons = Services.prefs.getStringPref(
              PREF_TEST_ADDONS,
              "[]"
            );
            testAddons = JSON.parse(testAddons);

            Services.prefs.setStringPref(
              PREF_TEST_ADDONS,
              JSON.stringify(
                testAddons.filter((a) => a.id != cachedAddon.addon_id)
              )
            );
          };
        } else {
          addon = await AddonManager.getAddonByID(cachedAddon.addon_id);
        }
        if (addon) {
          await sendDeletionPing(addon.id);
          await addon.uninstall();
        }
      }

      Services.prefs.clearUserPref(PREF_PIONEER_ID);
      for (const cachedAddon of cachedAddons) {
        const study = document.getElementById(cachedAddon.addon_id);
        if (study) {
          await updateStudy(cachedAddon.addon_id);
        }
      }

      document.getElementById("leave-pioneer-consent-dialog").close();
      // showEnrollmentStatus();
    });

  document
    .getElementById("join-study-accept-dialog-button")
    .addEventListener("click", async (event) => {
      const dialog = document.getElementById("join-study-consent-dialog");
      const studyAddonId = dialog.getAttribute("addon-id");
      toggleEnrolled(studyAddonId, cachedAddons).then(dialog.close());
    });

  document
    .getElementById("leave-study-accept-dialog-button")
    .addEventListener("click", async (event) => {
      const dialog = document.getElementById("leave-study-consent-dialog");
      const studyAddonId = dialog.getAttribute("addon-id");
      await toggleEnrolled(studyAddonId, cachedAddons).then(dialog.close());
    });
}

document.addEventListener("DOMContentLoaded", async (domEvent) => {
  // showEnrollmentStatus();

  // document.addEventListener("focus", removeBadge);
  // removeBadge();

  const privacyPolicyLinks = document.querySelectorAll(
    ".privacy-policy,.privacy-notice"
  );
  /*
  for (const privacyPolicyLink of privacyPolicyLinks) {
    const privacyPolicyFormattedLink = Services.urlFormatter.formatURL(
      privacyPolicyLink.href
    );
    privacyPolicyLink.href = privacyPolicyFormattedLink;
  }
  */

  // const cachedAddons = await RemoteSettings(STUDY_ADDON_COLLECTION_KEY).get();
  // let result = await fetch("https://firefox.settings.services.mozilla.com/v1/buckets/main/collections/pioneer-study-addons-v1/records");
  // console.debug("fetch result:", result);
  cachedAddons = [
    {
      name: "Demo Study",
      icons: {
        32: "https://addons.cdn.mozilla.net/user-media/addon_icons/2644/2644632-32.png?modified=4a64e2bc",
        64: "https://addons.cdn.mozilla.net/user-media/addon_icons/2644/2644632-64.png?modified=4a64e2bc",
        128: "https://addons.cdn.mozilla.net/user-media/addon_icons/2644/2644632-128.png?modified=4a64e2bc",
      },
      schema: 1597266497978,
      authors: {
        url:
          "https://addons.mozilla.org/en-US/firefox/addon/pioneer-v2-example/",
        name: "Pioneer Developers",
      },
      version: "1.0",
      addon_id: "pioneer-v2-example@mozilla.org",
      moreInfo: {
        spec:
          "https://addons.mozilla.org/en-US/firefox/addon/pioneer-v2-example/",
      },
      isDefault: false,
      sourceURI: {
        spec:
          "https://addons.mozilla.org/firefox/downloads/file/3579857/pioneer_v2-1.0-fx.xpi",
      },
      studyType: "extension",
      studyEnded: false,
      description: "Study purpose: Testing Pioneer.",
      privacyPolicy: {
        spec:
          "https://addons.mozilla.org/en-US/firefox/addon/pioneer-v2-example/",
      },
      joinStudyConsent:
        "This study will send an encrypted ping, only when the toolbar icon is clicked.",
      leaveStudyConsent: "This study cannot be re-joined.",
      dataCollectionDetails: ["The date and time"],
      id: "0eb02750-7159-4f09-96ae-5c7cb7424e89",
      last_modified: 1597280277565,
    },
  ];

  await setup(cachedAddons);

  try {
    await showAvailableStudies(cachedAddons);
  } catch (ex) {
    // No need to throw here, we'll try again before letting users enroll in any studies.
    console.error(`Could not show available studies`, ex);
  }
});
