def filter_parameters(data, block):
    """
    do not send attachments fields.
    """
    # TODO: handle attachments for schemaForm block
    if block["@type"] == "schemaForm":
        return [{
            "field_id": k,
            "value": v,
            "label": block["schema"]["properties"].get(k, {}).get("title", k),
        } for k, v in data["data"].items()]

    skip_fields = [
        x.get("field_id", "")
        for x in block.get("subblocks", [])
        if x.get("field_type", "") == "attachment"
    ]
    return [
        x
        for x in data.get("data", [])
        if x.get("field_id", "") not in skip_fields
    ]
