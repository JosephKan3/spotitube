import "./NavArrow.css"
import React from "react"

class NavArrow extends React.Component {
    renderArrow() {
        if (this.props.arrow === "up") {
            return <h6>&uarr;</h6>
        } else {
            return <h6>&darr;</h6>
        }
    }

    render() {
        return (
            this.renderArrow
        )
    }
}

export default NavArrow;