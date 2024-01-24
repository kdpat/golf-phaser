defmodule GolfWeb.AppComponents do
  use Phoenix.Component

  import GolfWeb.CoreComponents

  def chat(assigns) do
    ~H"""
    <div id="chat">
      <.chat_messages messages={@messages} />
      <.chat_form submit={@submit} />
    </div>
    """
  end

  def chat_messages(assigns) do
    ~H"""
    <ul id="chat-messages" phx-update="stream">
      <.chat_message :for={{id, msg} <- @messages} id={id} msg={msg} />
    </ul>
    """
  end

  defp chat_message(assigns) do
    ~H"""
    <li id={@id} class="chat-message">
      <span class="timestamp"><%= @msg.inserted_at %></span>
      <span class={"username turn-#{@msg.turn}"}><%= @msg.user.name %>:</span>
      <span class="text"><%= @msg.text %></span>
    </li>
    """
  end

  def chat_form(assigns) do
    ~H"""
    <form id="chat-form" phx-submit={@submit}>
      <.input
        id="chat-form-input"
        name="text"
        value=""
        placeholder="Type chat message here..."
        required
      />
      <.button>Submit</.button>
    </form>
    """
  end
end
