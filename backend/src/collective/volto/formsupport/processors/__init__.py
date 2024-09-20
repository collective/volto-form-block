def filter_parameters(data, block):
    """
    TODO do not send attachments fields.
    """
    return [{
        "field_id": k,
        "value": v,
        "label": block["schema"]["properties"].get(k, {}).get("title", k),
    } for k, v in data.items()]
