local http_service = game:GetService("HttpService")
local selection_service = game:GetService("Selection")
local studio_service = game:GetService("StudioService")

local server_url = "http://127.0.0.1:6969"
local update_interval = 5
local last_script_name = nil
local last_script_type = nil

local function get_script_type(obj)
	if obj:IsA("LocalScript") then
		return "LocalScript"
	elseif obj:IsA("ModuleScript") then
		return "ModuleScript"
	elseif obj:IsA("Script") then
		return "Script"
	end
	return nil
end

local function get_place_name()
    local ok, info = pcall(function()
        return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
    end)
    if ok and info and info.Name then
        return info.Name
    end
    return game.Name
end

local function send_update(script_name, script_type)
    local ok, err = pcall(function()
        http_service:PostAsync(
            server_url .. "/studio",
            http_service:JSONEncode({
                place_name = get_place_name(),
                place_id = tostring(game.PlaceId),
                script_name = script_name,
                script_type = script_type,
            }),
            Enum.HttpContentType.ApplicationJson
        )
    end)
    if not ok then
        warn("[presence] failed to send update: " .. tostring(err))
    end
end

local function send_clear()
	pcall(function()
		http_service:PostAsync(
			server_url .. "/studio/clear",
			"{}",
			Enum.HttpContentType.ApplicationJson
		)
	end)
end

local function on_selection_changed()
	local selected = selection_service:Get()

	for _, obj in ipairs(selected) do
		local script_type = get_script_type(obj)
		if script_type then
			if obj.Name ~= last_script_name or script_type ~= last_script_type then
				last_script_name = obj.Name
				last_script_type = script_type
				send_update(obj.Name, script_type)
			end
			return
		end
	end
end

local function update_loop()
	while true do
		local selected = selection_service:Get()
		local found = false

		for _, obj in ipairs(selected) do
			local script_type = get_script_type(obj)
			if script_type then
				send_update(obj.Name, script_type)
				found = true
				break
			end
		end

		if not found then
			send_update("no script selected", "idle")
		end

		task.wait(update_interval)
	end
end

selection_service.SelectionChanged:Connect(on_selection_changed)

studio_service:GetPropertyChangedSignal("ActiveScript"):Connect(function()
	local active = studio_service.ActiveScript
	if active then
		local script_type = get_script_type(active)
		if script_type then
			last_script_name = active.Name
			last_script_type = script_type
			send_update(active.Name, script_type)
		end
	end
end)

plugin.Unloading:Connect(function()
    send_clear()
end)

task.spawn(update_loop)

print("[presence] roblox studio presence plugin loaded")
