import os


def event_handler(event):
    if os.environ.get("__TEST_EVENT_HANDLER"):
        event.data["data"]["reply"] = "hello"
